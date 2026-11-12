package ve.edu.ucab.studybook;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.nio.file.Files;
import java.nio.file.Path;
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
import ve.edu.ucab.studybook.control.equipamiento.EquipamientoRepository;
import ve.edu.ucab.studybook.control.espacio.EspacioRepository;
import ve.edu.ucab.studybook.model.Cuenta;
import ve.edu.ucab.studybook.model.Equipamiento;
import ve.edu.ucab.studybook.model.Espacio;
import ve.edu.ucab.studybook.model.Rol;

/** Historias Crear equipamiento y Consultar equipamiento de un espacio. */
@SpringBootTest
@ActiveProfiles("test")
class EquipamientoTests {

	private static final String MIEMBRO = "miembro-equipo@test.dev";
	private static final String CLAVE = "Miembro-test-123";

	@Autowired
	WebApplicationContext contexto;
	@Autowired
	CuentaRepository cuentas;
	@Autowired
	EspacioRepository espacios;
	@Autowired
	EquipamientoRepository equipamientos;
	@Autowired
	PasswordEncoder encoder;

	MockMvc mvc;
	MockHttpSession admin;
	MockHttpSession miembro;
	Long espacioId;

	@BeforeEach
	void preparar() throws Exception {
		mvc = MockMvcBuilders.webAppContextSetup(contexto).build();
		if (cuentas.buscarPorCorreo(MIEMBRO).isEmpty()) {
			cuentas.guardar(new Cuenta(null, "Miembro", "V-4", MIEMBRO, "0", encoder.encode(CLAVE), Rol.MIEMBRO));
		}
		admin = sesion("admin@test.dev", "Admin-test-123");
		miembro = sesion(MIEMBRO, CLAVE);
		// Un espacio propio por prueba, para que no dependan del orden.
		espacioId = espacios.guardar(new Espacio(null, "Sala " + System.nanoTime(), "Biblioteca", "1", "", 6)).id();
	}

	private MockHttpSession sesion(String correo, String clave) throws Exception {
		String cuerpo = "{\"correo\":\"%s\",\"clave\":\"%s\"}".formatted(correo, clave);
		MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(cuerpo)).andReturn();
		assertThat(r.getResponse().getStatus()).isEqualTo(200);
		return (MockHttpSession) r.getRequest().getSession(false);
	}

	private static String cuerpo(String nombre, String categoria, String descripcion, String estado, Long espacio) {
		return "{\"nombre\":%s,\"categoria\":%s,\"descripcion\":%s,\"estado\":%s,\"espacioId\":%s}".formatted(
				texto(nombre), texto(categoria), texto(descripcion), texto(estado), espacio);
	}

	private static String texto(String v) {
		return v == null ? "null" : "\"" + v + "\"";
	}

	private String valido(String nombre) {
		return cuerpo(nombre, "Audiovisual", "Pantalla de 55 pulgadas", "Disponible", espacioId);
	}

	private MvcResult crear(MockHttpSession sesion, String json) throws Exception {
		var peticion = post("/api/equipamientos").contentType(MediaType.APPLICATION_JSON).content(json);
		if (sesion != null) {
			peticion.session(sesion);
		}
		return mvc.perform(peticion).andReturn();
	}

	private MvcResult listar(MockHttpSession sesion, Long espacio) throws Exception {
		var peticion = get("/api/equipamientos").param("espacioId", String.valueOf(espacio));
		if (sesion != null) {
			peticion.session(sesion);
		}
		return mvc.perform(peticion).andReturn();
	}

	@Test
	void elAdministradorCreaEquipamientoYAparecenSusDatos() throws Exception {
		MvcResult r = crear(admin, valido("Proyector"));
		assertThat(r.getResponse().getStatus()).isEqualTo(200);
		String cuerpo = r.getResponse().getContentAsString();
		assertThat(cuerpo).contains("Proyector").contains("Audiovisual").contains("Disponible").contains("\"id\"");
	}

	@Test
	void elEquipamientoCreadoSeConsultaEnSuEspacio() throws Exception {
		crear(admin, valido("Proyector"));
		crear(admin, cuerpo("Pizarra", "Mobiliario", "Pizarra blanca", "Disponible", espacioId));
		MvcResult r = listar(miembro, espacioId);
		assertThat(r.getResponse().getStatus()).isEqualTo(200);
		assertThat(r.getResponse().getContentAsString()).contains("Proyector").contains("Pizarra");
	}

	@Test
	void elEquipamientoDeOtroEspacioNoAparece() throws Exception {
		Long otro = espacios.guardar(new Espacio(null, "Otra " + System.nanoTime(), "Edificio", "2", "", 4)).id();
		crear(admin, cuerpo("Cafetera", "Servicio", "Cafetera", "Disponible", otro));
		assertThat(listar(admin, espacioId).getResponse().getContentAsString()).doesNotContain("Cafetera");
	}

	@Test
	void unEspacioSinEquipamientoDevuelveUnaListaVacia() throws Exception {
		MvcResult r = listar(miembro, espacioId);
		assertThat(r.getResponse().getStatus()).isEqualTo(200);
		assertThat(r.getResponse().getContentAsString()).isEqualTo("[]");
	}

	@Test
	void unMiembroNoPuedeCrearEquipamiento() throws Exception {
		assertThat(crear(miembro, valido("Proyector")).getResponse().getStatus()).isEqualTo(403);
		assertThat(listar(admin, espacioId).getResponse().getContentAsString()).isEqualTo("[]");
	}

	@Test
	void sinSesionCrearYConsultarDan401() throws Exception {
		assertThat(crear(null, valido("Proyector")).getResponse().getStatus()).isEqualTo(401);
		assertThat(listar(null, espacioId).getResponse().getStatus()).isEqualTo(401);
	}

	@Test
	void cadaCampoObligatorioVacioDa400IndicandoElCampo() throws Exception {
		String[][] casos = {
				{"nombre", cuerpo(" ", "Audiovisual", "d", "Disponible", espacioId)},
				{"categoria", cuerpo("A", "", "d", "Disponible", espacioId)},
				{"descripcion", cuerpo("A", "Audiovisual", null, "Disponible", espacioId)},
				{"estado", cuerpo("A", "Audiovisual", "d", " ", espacioId)},
				{"espacioId", cuerpo("A", "Audiovisual", "d", "Disponible", null)},
		};
		for (String[] caso : casos) {
			MvcResult r = crear(admin, caso[1]);
			assertThat(r.getResponse().getStatus()).as(caso[0]).isEqualTo(400);
			assertThat(r.getResponse().getContentAsString()).as(caso[0]).contains("\"" + caso[0] + "\"")
					.contains("Este campo es obligatorio.");
		}
	}

	@Test
	void unEspacioInexistenteAlCrearDa400ConUnMensajeClaro() throws Exception {
		MvcResult r = crear(admin, cuerpo("A", "Audiovisual", "d", "Disponible", 987654L));
		assertThat(r.getResponse().getStatus()).isEqualTo(400);
		assertThat(r.getResponse().getContentAsString()).contains("espacioId").contains("El espacio indicado no existe");
	}

	@Test
	void unEspacioInexistenteAlConsultarDa404ConUnMensajeClaro() throws Exception {
		MvcResult r = listar(admin, 987654L);
		assertThat(r.getResponse().getStatus()).isEqualTo(404);
		assertThat(r.getResponse().getContentAsString()).contains("El espacio indicado no existe");
	}

	@Test
	void elMismoNombreEnElMismoEspacioSeRechazaSinImportarMayusculasNiEspacios() throws Exception {
		assertThat(crear(admin, valido("Proyector")).getResponse().getStatus()).isEqualTo(200);
		MvcResult r = crear(admin, valido("  PROYECTOR "));
		assertThat(r.getResponse().getStatus()).isEqualTo(400);
		assertThat(r.getResponse().getContentAsString()).contains("Este espacio ya tiene ese equipamiento");
	}

	@Test
	void elMismoNombreEnOtroEspacioSePermite() throws Exception {
		Long otro = espacios.guardar(new Espacio(null, "Otra " + System.nanoTime(), "Edificio", "2", "", 4)).id();
		assertThat(crear(admin, valido("Proyector")).getResponse().getStatus()).isEqualTo(200);
		assertThat(crear(admin, cuerpo("Proyector", "Audiovisual", "d", "Disponible", otro)).getResponse().getStatus())
				.isEqualTo(200);
	}

	@Test
	void dosPeticionesSimultaneasIgualesCreanUnSoloEquipamiento() throws Exception {
		ExecutorService hilos = Executors.newFixedThreadPool(2);
		try {
			Future<Integer> a = hilos.submit(() -> crear(admin, valido("Router")).getResponse().getStatus());
			Future<Integer> b = hilos.submit(() -> crear(admin, valido("Router")).getResponse().getStatus());
			assertThat(List.of(a.get(), b.get())).containsExactlyInAnyOrder(200, 400);
		}
		finally {
			hilos.shutdownNow();
		}
		assertThat(equipamientos.listarPorEspacio(espacioId)).hasSize(1);
	}

	@Test
	void losDatosSeGuardanSinEspaciosSobrantes() throws Exception {
		crear(admin, cuerpo("  Proyector  ", " Audiovisual ", " d ", " Disponible ", espacioId));
		Equipamiento guardado = equipamientos.listarPorEspacio(espacioId).get(0);
		assertThat(guardado.nombre()).isEqualTo("Proyector");
		assertThat(guardado.categoria()).isEqualTo("Audiovisual");
		assertThat(guardado.estado()).isEqualTo("Disponible");
	}

	@Test
	void elEquipamientoPersisteAlReiniciar(@TempDir Path carpeta) {
		EquipamientoRepository antes = new EquipamientoRepository(carpeta.toString());
		antes.guardar(new Equipamiento(null, "Proyector", "Audiovisual", "d", "Disponible", 1L));
		assertThat(Files.exists(carpeta.resolve("equipamientos.json"))).isTrue();
		EquipamientoRepository despues = new EquipamientoRepository(carpeta.toString());
		assertThat(despues.listarPorEspacio(1L)).extracting(Equipamiento::nombre).containsExactly("Proyector");
	}
}
