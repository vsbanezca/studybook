package ve.edu.ucab.studybook;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import ve.edu.ucab.studybook.control.cuenta.CuentaRepository;
import ve.edu.ucab.studybook.control.espacio.EspacioRepository;
import ve.edu.ucab.studybook.control.reserva.ReservaRepository;
import ve.edu.ucab.studybook.model.Cuenta;
import ve.edu.ucab.studybook.model.EstadoReserva;
import ve.edu.ucab.studybook.model.Espacio;
import ve.edu.ucab.studybook.model.Reserva;
import ve.edu.ucab.studybook.model.Rol;

/** Historia Crear reserva: reglas, capacidad, disponibilidad, atomicidad, roles y Consultar mis reservas (backend). */
@SpringBootTest
@ActiveProfiles("test")
class ReservaTests {

	private static final String CLAVE = "Miembro-test-123";
	private static final String CAPACIDAD = "La cantidad de asistentes supera la capacidad del espacio";
	private static final String NO_DISPONIBLE = "El espacio ya está reservado en esa fecha y horario";

	@Autowired
	WebApplicationContext contexto;
	@Autowired
	CuentaRepository cuentas;
	@Autowired
	EspacioRepository espacios;
	@Autowired
	ReservaRepository reservas;
	@Autowired
	PasswordEncoder encoder;

	MockMvc mvc;
	MockHttpSession ana;
	MockHttpSession luis;
	MockHttpSession admin;
	Long espacioId;
	LocalDate fecha;

	@BeforeEach
	void preparar() throws Exception {
		mvc = MockMvcBuilders.webAppContextSetup(contexto).build();
		crearMiembro("ana-reserva@test.dev");
		crearMiembro("luis-reserva@test.dev");
		ana = sesion("ana-reserva@test.dev", CLAVE);
		luis = sesion("luis-reserva@test.dev", CLAVE);
		admin = sesion("admin@test.dev", "Admin-test-123");
		// Un espacio y un dia propios por prueba, para que no dependan del orden.
		espacioId = espacios.guardar(new Espacio(null, "Sala " + System.nanoTime(), "Biblioteca", "1", "", 6)).id();
		fecha = LocalDate.now().plusDays(30 + (System.nanoTime() % 300));
	}

	private void crearMiembro(String correo) {
		if (cuentas.buscarPorCorreo(correo).isEmpty()) {
			cuentas.guardar(new Cuenta(null, "Miembro", "V-" + correo.hashCode(), correo, "0", encoder.encode(CLAVE), Rol.MIEMBRO));
		}
	}

	private MockHttpSession sesion(String correo, String clave) throws Exception {
		String cuerpo = "{\"correo\":\"%s\",\"clave\":\"%s\"}".formatted(correo, clave);
		MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(cuerpo)).andReturn();
		assertThat(r.getResponse().getStatus()).isEqualTo(200);
		return (MockHttpSession) r.getRequest().getSession(false);
	}

	private String json(Long espacio, Object fecha, String inicio, String fin, Object asistentes) {
		return "{\"espacioId\":%s,\"fecha\":%s,\"horaInicio\":%s,\"horaFin\":%s,\"asistentes\":%s}".formatted(
				espacio, texto(fecha), texto(inicio), texto(fin), asistentes);
	}

	private static String texto(Object v) {
		return v == null ? "null" : "\"" + v + "\"";
	}

	private String valida(String inicio, String fin) {
		return json(espacioId, fecha, inicio, fin, 4);
	}

	private MvcResult enviar(String ruta, MockHttpSession sesion, String cuerpo) throws Exception {
		var peticion = post(ruta).contentType(MediaType.APPLICATION_JSON).content(cuerpo);
		if (sesion != null) {
			peticion.session(sesion);
		}
		return mvc.perform(peticion).andReturn();
	}

	private MvcResult crear(MockHttpSession sesion, String cuerpo) throws Exception {
		return enviar("/api/reservas", sesion, cuerpo);
	}

	private MvcResult validar(MockHttpSession sesion, String cuerpo) throws Exception {
		return enviar("/api/reservas/validar", sesion, cuerpo);
	}

	private int estadoCrear(String cuerpo) throws Exception {
		return crear(ana, cuerpo).getResponse().getStatus();
	}

	private void esperaRechazoDeCampo(String cuerpo, String campo, String mensaje) throws Exception {
		for (MvcResult r : List.of(validar(ana, cuerpo), crear(ana, cuerpo))) {
			assertThat(r.getResponse().getStatus()).as(campo).isEqualTo(400);
			String texto = r.getResponse().getContentAsString();
			assertThat(texto).as(campo).contains("Datos proporcionados incorrectos").contains("\"" + campo + "\"").contains(mensaje);
		}
	}

	// ----- reserva valida -----

	@Test
	void unaReservaValidaSeRegistraConCodigoMiembroYEstadoActiva() throws Exception {
		MvcResult r = crear(ana, valida("14:00", "15:30"));
		assertThat(r.getResponse().getStatus()).isEqualTo(201);
		String cuerpo = r.getResponse().getContentAsString();
		assertThat(cuerpo).contains("\"codigo\":\"RES-").contains("ACTIVA").contains("14:00").contains("15:30")
				.contains("\"asistentes\":4").contains(fecha.toString());
		Reserva guardada = reservas.listarPorMiembro("ana-reserva@test.dev").stream()
				.filter(x -> x.espacioId().equals(espacioId)).findFirst().orElseThrow();
		assertThat(guardada.estado()).isEqualTo(EstadoReserva.ACTIVA);
		assertThat(guardada.miembro()).isEqualTo("ana-reserva@test.dev");
	}

	@Test
	void loscodigosSonUnicos() throws Exception {
		String a = crear(ana, valida("08:00", "09:00")).getResponse().getContentAsString();
		String b = crear(ana, valida("10:00", "11:00")).getResponse().getContentAsString();
		assertThat(codigoDe(a)).isNotEqualTo(codigoDe(b));
	}

	private static String codigoDe(String json) {
		int i = json.indexOf("\"codigo\":\"") + 10;
		return json.substring(i, json.indexOf('"', i));
	}

	@Test
	void elMiembroSiempreEsElDeLaSesionAunqueElClienteEnvieOtro() throws Exception {
		String conMiembro = valida("14:00", "15:00").replace("}", ",\"miembro\":\"luis-reserva@test.dev\",\"estado\":\"CANCELADA\"}");
		assertThat(crear(ana, conMiembro).getResponse().getStatus()).isEqualTo(201);
		assertThat(reservas.listarPorMiembro("luis-reserva@test.dev").stream().filter(x -> x.espacioId().equals(espacioId))).isEmpty();
		assertThat(reservas.listarPorMiembro("ana-reserva@test.dev").stream().filter(x -> x.espacioId().equals(espacioId)).findFirst().orElseThrow().estado())
				.isEqualTo(EstadoReserva.ACTIVA);
	}

	// ----- reglas de validacion (campo y texto) -----

	@Test
	void cadaCampoObligatorioVacioDa400IndicandoElCampo() throws Exception {
		esperaRechazoDeCampo(json(null, fecha, "14:00", "15:00", 2), "espacioId", "Este campo es obligatorio.");
		esperaRechazoDeCampo(json(espacioId, null, "14:00", "15:00", 2), "fecha", "Este campo es obligatorio.");
		esperaRechazoDeCampo(json(espacioId, fecha, "", "15:00", 2), "horaInicio", "Este campo es obligatorio.");
		esperaRechazoDeCampo(json(espacioId, fecha, "14:00", " ", 2), "horaFin", "Este campo es obligatorio.");
		esperaRechazoDeCampo(json(espacioId, fecha, "14:00", "15:00", null), "asistentes", "Este campo es obligatorio.");
	}

	@Test
	void laFechaNoPuedeEstarEnElPasado() throws Exception {
		esperaRechazoDeCampo(json(espacioId, LocalDate.now().minusDays(1), "14:00", "15:00", 2), "fecha", "no puede estar en el pasado");
	}

	@Test
	void unaFechaConFormatoInvalidoSeRechaza() throws Exception {
		esperaRechazoDeCampo(json(espacioId, "15/11/2026", "14:00", "15:00", 2), "fecha", "La fecha no es válida");
	}

	@Test
	void laHoraDeFinDebeSerPosteriorALaDeInicio() throws Exception {
		esperaRechazoDeCampo(valida("15:00", "15:00"), "horaFin", "posterior a la hora de inicio");
		esperaRechazoDeCampo(valida("16:00", "15:00"), "horaFin", "posterior a la hora de inicio");
	}

	@Test
	void unaHoraConFormatoInvalidoSeRechaza() throws Exception {
		esperaRechazoDeCampo(json(espacioId, fecha, "tarde", "15:00", 2), "horaInicio", "La hora no es válida");
	}

	@Test
	void losAsistentesDebenSerUnEnteroMayorOIgualA1() throws Exception {
		String mensaje = "número entero mayor o igual a 1";
		esperaRechazoDeCampo(json(espacioId, fecha, "14:00", "15:00", 0), "asistentes", mensaje);
		esperaRechazoDeCampo(json(espacioId, fecha, "14:00", "15:00", -3), "asistentes", mensaje);
		esperaRechazoDeCampo(json(espacioId, fecha, "14:00", "15:00", "\"abc\"").replace("\"\\\"abc\\\"\"", "\"abc\""), "asistentes", mensaje);
		esperaRechazoDeCampo(json(espacioId, fecha, "14:00", "15:00", "\"2.5\"").replace("\"\\\"2.5\\\"\"", "\"2.5\""), "asistentes", mensaje);
	}

	@Test
	void unEspacioInexistenteSeRechazaIndicandoElCampo() throws Exception {
		esperaRechazoDeCampo(json(987654L, fecha, "14:00", "15:00", 2), "espacioId", "El espacio indicado no existe");
	}

	@Test
	void unCuerpoIlegibleDa400() throws Exception {
		assertThat(crear(ana, "no es json").getResponse().getStatus()).isEqualTo(400);
	}

	// ----- capacidad -----

	@Test
	void masAsistentesQueLaCapacidadSeRechazaConElTextoLiteral() throws Exception {
		for (MvcResult r : List.of(validar(ana, json(espacioId, fecha, "14:00", "15:00", 7)), crear(ana, json(espacioId, fecha, "14:00", "15:00", 7)))) {
			assertThat(r.getResponse().getStatus()).isEqualTo(400);
			String cuerpo = r.getResponse().getContentAsString();
			assertThat(cuerpo).startsWith("{\"mensaje\":\"" + CAPACIDAD + "\"").contains("\"asistentes\"");
		}
	}

	@Test
	void exactamenteLaCapacidadSePermite() throws Exception {
		assertThat(estadoCrear(json(espacioId, fecha, "14:00", "15:00", 6))).isEqualTo(201);
	}

	// ----- disponibilidad -----

	private void esperaNoDisponible(String cuerpo) throws Exception {
		MvcResult r = crear(luis, cuerpo);
		assertThat(r.getResponse().getStatus()).isEqualTo(409);
		assertThat(r.getResponse().getContentAsString()).startsWith("{\"mensaje\":\"" + NO_DISPONIBLE + "\"");
	}

	@Test
	void elMismoHorarioExactoChoca() throws Exception {
		estadoCrear(valida("14:00", "16:00"));
		esperaNoDisponible(valida("14:00", "16:00"));
	}

	@Test
	void unSolapeParcialChoca() throws Exception {
		estadoCrear(valida("14:00", "16:00"));
		esperaNoDisponible(valida("13:00", "14:30"));
		esperaNoDisponible(valida("15:30", "17:00"));
	}

	@Test
	void unaReservaContenidaOQueContieneChoca() throws Exception {
		estadoCrear(valida("14:00", "18:00"));
		esperaNoDisponible(valida("15:00", "16:00"));
		esperaNoDisponible(valida("13:00", "19:00"));
	}

	@Test
	void elMismoEspacioEnOtroDiaNoChoca() throws Exception {
		estadoCrear(valida("14:00", "16:00"));
		assertThat(crear(luis, json(espacioId, fecha.plusDays(1), "14:00", "16:00", 2)).getResponse().getStatus()).isEqualTo(201);
	}

	@Test
	void otroEspacioElMismoHorarioNoChoca() throws Exception {
		estadoCrear(valida("14:00", "16:00"));
		Long otro = espacios.guardar(new Espacio(null, "Otra " + System.nanoTime(), "Edificio", "2", "", 6)).id();
		assertThat(crear(luis, json(otro, fecha, "14:00", "16:00", 2)).getResponse().getStatus()).isEqualTo(201);
	}

	@Test
	void lasReservasContiguasNoChocan() throws Exception {
		estadoCrear(valida("14:00", "16:00"));
		assertThat(crear(luis, valida("16:00", "17:00")).getResponse().getStatus()).isEqualTo(201);
		assertThat(crear(luis, valida("13:00", "14:00")).getResponse().getStatus()).isEqualTo(201);
	}

	@Test
	void unaReservaCanceladaNoBloqueaElHorario() throws Exception {
		reservas.guardar(new Reserva(null, null, "ana-reserva@test.dev", espacioId, fecha, LocalTime.of(14, 0), LocalTime.of(16, 0), 2,
				EstadoReserva.CANCELADA));
		assertThat(crear(luis, valida("14:00", "16:00")).getResponse().getStatus()).isEqualTo(201);
	}

	// ----- validar no guarda; crear revalida -----

	@Test
	void validarNoGuardaNada() throws Exception {
		long antes = reservas.listar().size();
		MvcResult r = validar(ana, valida("14:00", "15:00"));
		assertThat(r.getResponse().getStatus()).isEqualTo(200);
		assertThat(r.getResponse().getContentAsString()).contains("true");
		assertThat((long) reservas.listar().size()).isEqualTo(antes);
		// y como no se guardo, se puede reservar despues
		assertThat(estadoCrear(valida("14:00", "15:00"))).isEqualTo(201);
	}

	@Test
	void validarTambienDetectaElChoque() throws Exception {
		estadoCrear(valida("14:00", "16:00"));
		MvcResult r = validar(luis, valida("15:00", "16:30"));
		assertThat(r.getResponse().getStatus()).isEqualTo(409);
	}

	@Test
	void crearRevalidaAunqueNoSeHayaLlamadoAValidar() throws Exception {
		assertThat(crear(ana, json(espacioId, fecha, "14:00", "15:00", 99)).getResponse().getStatus()).isEqualTo(400);
		assertThat(crear(ana, json(espacioId, LocalDate.now().minusDays(2), "14:00", "15:00", 2)).getResponse().getStatus()).isEqualTo(400);
		assertThat(reservas.listarPorMiembro("ana-reserva@test.dev").stream().filter(x -> x.espacioId().equals(espacioId))).isEmpty();
	}

	@Test
	void unHorarioQueSeOcupoEntreValidarYCrearSeRechazaAlCrear() throws Exception {
		assertThat(validar(luis, valida("14:00", "15:00")).getResponse().getStatus()).isEqualTo(200);
		estadoCrear(valida("14:30", "15:30"));
		assertThat(crear(luis, valida("14:00", "15:00")).getResponse().getStatus()).isEqualTo(409);
	}

	// ----- concurrencia -----

	@Test
	void dosPeticionesSimultaneasPorElMismoHorarioCreanUnaSolaReserva() throws Exception {
		ExecutorService hilos = Executors.newFixedThreadPool(2);
		try {
			Future<Integer> a = hilos.submit(() -> crear(ana, valida("14:00", "16:00")).getResponse().getStatus());
			Future<Integer> b = hilos.submit(() -> crear(luis, valida("15:00", "17:00")).getResponse().getStatus());
			assertThat(List.of(a.get(), b.get())).containsExactlyInAnyOrder(201, 409);
		}
		finally {
			hilos.shutdownNow();
		}
		long activas = reservas.listar().stream().filter(r -> r.espacioId().equals(espacioId)).count();
		assertThat(activas).isEqualTo(1);
	}

	// ----- roles -----

	@Test
	void elAdministradorRecibe403EnTodasLasRutasDeReservas() throws Exception {
		assertThat(crear(admin, valida("14:00", "15:00")).getResponse().getStatus()).isEqualTo(403);
		assertThat(validar(admin, valida("14:00", "15:00")).getResponse().getStatus()).isEqualTo(403);
		assertThat(mvc.perform(get("/api/reservas/mias").session(admin)).andReturn().getResponse().getStatus()).isEqualTo(403);
		assertThat(reservas.listar().stream().filter(r -> r.espacioId().equals(espacioId))).isEmpty();
	}

	@Test
	void sinSesionDa401() throws Exception {
		assertThat(crear(null, valida("14:00", "15:00")).getResponse().getStatus()).isEqualTo(401);
		assertThat(validar(null, valida("14:00", "15:00")).getResponse().getStatus()).isEqualTo(401);
		assertThat(mvc.perform(get("/api/reservas/mias")).andReturn().getResponse().getStatus()).isEqualTo(401);
	}

	// ----- Consultar mis reservas -----

	@Test
	void miasSoloDevuelveLasDelMiembroDeLaSesion() throws Exception {
		crear(ana, valida("08:00", "09:00"));
		crear(luis, valida("10:00", "11:00"));
		String deAna = mvc.perform(get("/api/reservas/mias").session(ana)).andReturn().getResponse().getContentAsString();
		String deLuis = mvc.perform(get("/api/reservas/mias").session(luis)).andReturn().getResponse().getContentAsString();
		assertThat(deAna).contains("08:00").doesNotContain("10:00");
		assertThat(deLuis).contains("10:00").doesNotContain("08:00");
	}

	@Test
	void miasMuestraLaReservaNuevaDeInmediatoConLosDatosDelEspacio() throws Exception {
		crear(ana, valida("14:00", "15:30"));
		String cuerpo = mvc.perform(get("/api/reservas/mias").session(ana)).andReturn().getResponse().getContentAsString();
		assertThat(cuerpo).contains("Biblioteca").contains("\"espacioNombre\":\"Sala ").contains("14:00").contains("ACTIVA");
	}

	@Test
	void miasOrdenaLasProximasPrimero() throws Exception {
		crear(ana, json(espacioId, fecha.plusDays(5), "09:00", "10:00", 2));
		crear(ana, json(espacioId, fecha, "09:00", "10:00", 2));
		crear(ana, json(espacioId, fecha.plusDays(2), "09:00", "10:00", 2));
		String cuerpo = mvc.perform(get("/api/reservas/mias").session(ana)).andReturn().getResponse().getContentAsString();
		int primera = cuerpo.indexOf(fecha.toString());
		int segunda = cuerpo.indexOf(fecha.plusDays(2).toString());
		int tercera = cuerpo.indexOf(fecha.plusDays(5).toString());
		assertThat(primera).isGreaterThanOrEqualTo(0);
		assertThat(primera).isLessThan(segunda);
		assertThat(segunda).isLessThan(tercera);
	}

	// ----- persistencia y tiempo -----

	@Test
	void lasReservasPersistenAlReiniciar(@TempDir Path carpeta) {
		ReservaRepository antes = new ReservaRepository(carpeta.toString());
		antes.guardarSiDisponible(new Reserva(null, null, "a@ucab.edu.ve", 1L, LocalDate.of(2030, 1, 15), LocalTime.of(9, 0),
				LocalTime.of(10, 0), 2, EstadoReserva.ACTIVA));
		assertThat(Files.exists(carpeta.resolve("reservas.json"))).isTrue();
		ReservaRepository despues = new ReservaRepository(carpeta.toString());
		assertThat(despues.listar()).hasSize(1);
		assertThat(despues.listar().get(0).codigo()).isEqualTo("RES-000001");
		assertThat(despues.listar().get(0).fecha()).isEqualTo(LocalDate.of(2030, 1, 15));
		assertThat(despues.hayChoque(1L, LocalDate.of(2030, 1, 15), LocalTime.of(9, 30), LocalTime.of(11, 0))).isTrue();
	}

	@Test
	void respondeEnMenosDe3Segundos() throws Exception {
		long inicio = System.nanoTime();
		MvcResult r = crear(ana, valida("14:00", "15:00"));
		long ms = (System.nanoTime() - inicio) / 1_000_000;
		assertThat(r.getResponse().getStatus()).isEqualTo(201);
		assertThat(ms).isLessThan(3000);
	}
}
