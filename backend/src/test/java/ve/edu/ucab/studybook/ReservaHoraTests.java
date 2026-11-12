package ve.edu.ucab.studybook;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
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

/**
 * Regla de la hora de inicio con un reloj fijo: hoy es el 15/06/2030 a las 14:30:45 (America/Caracas).
 * La fecha de las pruebas es futura para el reloj real, pero el servidor solo mira el reloj inyectado.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(ReservaHoraTests.RelojFijo.class)
class ReservaHoraTests {

	static final ZoneId ZONA = ZoneId.of("America/Caracas");
	static final LocalDate HOY = LocalDate.of(2030, 6, 15);

	@TestConfiguration
	static class RelojFijo {
		@Bean
		@Primary
		Clock relojFijo() {
			return Clock.fixed(HOY.atTime(14, 30, 45).atZone(ZONA).toInstant(), ZONA);
		}
	}

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
	MockHttpSession sesion;
	Long espacioId;

	@BeforeEach
	void preparar() throws Exception {
		mvc = MockMvcBuilders.webAppContextSetup(contexto).build();
		sesion = sesionDe("hora@test.dev");
		espacioId = espacios.guardar(new Espacio(null, "Sala " + System.nanoTime(), "Biblioteca", "1", "", 6)).id();
	}

	private MockHttpSession sesionDe(String correo) throws Exception {
		if (cuentas.buscarPorCorreo(correo).isEmpty()) {
			cuentas.guardar(new Cuenta(null, "Miembro", "V-" + correo.hashCode(), correo, "0", encoder.encode("Miembro-test-123"), Rol.MIEMBRO));
		}
		String cuerpo = "{\"correo\":\"%s\",\"clave\":\"Miembro-test-123\"}".formatted(correo);
		MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(cuerpo)).andReturn();
		return (MockHttpSession) r.getRequest().getSession(false);
	}

	private String cuerpo(LocalDate fecha, String inicio, String fin) {
		return "{\"espacioId\":%d,\"fecha\":\"%s\",\"horaInicio\":\"%s\",\"horaFin\":\"%s\",\"asistentes\":2}".formatted(
				espacioId, fecha, inicio, fin);
	}

	private MvcResult enviar(String ruta, String json) throws Exception {
		return mvc.perform(post(ruta).session(sesion).contentType(MediaType.APPLICATION_JSON).content(json)).andReturn();
	}

	private void esperaHoraPasada(LocalDate fecha, String inicio, String fin) throws Exception {
		// Tanto validar como crear (que revalida) rechazan, con el mismo mensaje y el campo de la hora de inicio.
		for (String ruta : new String[] { "/api/reservas/validar", "/api/reservas" }) {
			MvcResult r = enviar(ruta, cuerpo(fecha, inicio, fin));
			assertThat(r.getResponse().getStatus()).as("%s %s", ruta, inicio).isEqualTo(400);
			assertThat(r.getResponse().getContentAsString()).startsWith("{\"mensaje\":\"Datos proporcionados incorrectos\"")
					.contains("\"horaInicio\":\"La hora de inicio no puede ser anterior a la hora actual\"");
		}
		assertThat(reservas.listar().stream().filter(x -> x.espacioId().equals(espacioId))).isEmpty();
	}

	@Test
	void hoyConHoraYaPasadaSeRechaza() throws Exception {
		esperaHoraPasada(HOY, "08:00", "09:00");
		esperaHoraPasada(HOY, "14:29", "15:00");
	}

	@Test
	void hoyConHoraFuturaSeAcepta() throws Exception {
		assertThat(enviar("/api/reservas/validar", cuerpo(HOY, "14:31", "15:00")).getResponse().getStatus()).isEqualTo(200);
		assertThat(enviar("/api/reservas", cuerpo(HOY, "18:00", "19:00")).getResponse().getStatus()).isEqualTo(201);
	}

	@Test
	void fronteraExactaLaHoraIgualALaActualSeAcepta() throws Exception {
		// Son las 14:30:45: la comparacion es por minuto, asi que 14:30 no es anterior a la hora actual.
		assertThat(enviar("/api/reservas", cuerpo(HOY, "14:30", "15:30")).getResponse().getStatus()).isEqualTo(201);
	}

	@Test
	void mananaSeAceptaAunqueLaHoraSeaMenorQueLaActual() throws Exception {
		assertThat(enviar("/api/reservas", cuerpo(HOY.plusDays(1), "08:00", "09:00")).getResponse().getStatus()).isEqualTo(201);
	}

	@Test
	void ayerSeRechazaPorLaFecha() throws Exception {
		for (String ruta : new String[] { "/api/reservas/validar", "/api/reservas" }) {
			MvcResult r = enviar(ruta, cuerpo(HOY.minusDays(1), "18:00", "19:00"));
			assertThat(r.getResponse().getStatus()).isEqualTo(400);
			assertThat(r.getResponse().getContentAsString()).contains("\"fecha\":\"La fecha no puede estar en el pasado\"");
		}
	}

	@Test
	void elClockUsaLaZonaConfigurada() {
		Clock reloj = contexto.getBean("relojFijo", Clock.class);
		assertThat(reloj.getZone()).isEqualTo(ZONA);
		assertThat(Instant.now(reloj).atZone(ZONA).toLocalTime()).isEqualTo(LocalTime.of(14, 30, 45));
	}

	@Test
	void laZonaHorariaInicialEsAmericaCaracas(@Autowired org.springframework.core.env.Environment entorno) {
		assertThat(entorno.getProperty("studybook.zona-horaria")).isEqualTo("America/Caracas");
	}

	@Test
	void misReservasVigentesPrimeroConLaMasCercanaArribaYLuegoLasPasadas() throws Exception {
		String correo = "orden-" + System.nanoTime() + "@test.dev";
		MockHttpSession propia = sesionDe(correo);
		LocalTime nueve = LocalTime.of(9, 0);
		// Pasadas respecto del reloj fijo (hoy 14:30): ayer y hoy 13:00 a 14:00.
		reservas.guardar(new Reserva(null, null, correo, espacioId, HOY.minusDays(1), nueve, nueve.plusHours(1), 2, EstadoReserva.ACTIVA));
		reservas.guardar(new Reserva(null, null, correo, espacioId, HOY, LocalTime.of(13, 0), LocalTime.of(14, 0), 2, EstadoReserva.ACTIVA));
		// Vigentes: manana 09:00, hoy 16:00 y hoy 14:00 a 15:00 (en curso).
		reservas.guardar(new Reserva(null, null, correo, espacioId, HOY.plusDays(1), nueve, nueve.plusHours(1), 2, EstadoReserva.ACTIVA));
		reservas.guardar(new Reserva(null, null, correo, espacioId, HOY, LocalTime.of(16, 0), LocalTime.of(17, 0), 2, EstadoReserva.ACTIVA));
		reservas.guardar(new Reserva(null, null, correo, espacioId, HOY, LocalTime.of(14, 0), LocalTime.of(15, 0), 2, EstadoReserva.ACTIVA));

		String json = mvc.perform(get("/api/reservas/mias").session(propia)).andReturn().getResponse().getContentAsString();
		var orden = new java.util.ArrayList<String>();
		java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"fecha\":\"([^\"]+)\",\"horaInicio\":\"([^\"]+)\"").matcher(json);
		while (m.find()) {
			orden.add(m.group(1) + " " + m.group(2));
		}
		assertThat(orden).containsExactly(
				HOY + " 14:00", HOY + " 16:00", HOY.plusDays(1) + " 09:00",
				HOY + " 13:00", HOY.minusDays(1) + " 09:00");
	}

	@Test
	void elCodigoNuncaSeRepiteTrasReiniciarNiConReservasCanceladas(@TempDir Path carpeta) {
		ReservaRepository antes = new ReservaRepository(carpeta.toString());
		Reserva primera = antes.guardar(new Reserva(null, null, "a@ucab.edu.ve", 1L, HOY, nueve(), nueve().plusHours(1), 1, EstadoReserva.ACTIVA));
		Reserva segunda = antes.guardar(new Reserva(null, null, "a@ucab.edu.ve", 1L, HOY, nueve(), nueve().plusHours(1), 1, EstadoReserva.CANCELADA));
		assertThat(primera.codigo()).isEqualTo("RES-000001");
		assertThat(segunda.codigo()).isEqualTo("RES-000002");
		// Reinicio simulado: un repositorio nuevo sobre el mismo archivo, cuyo maximo es una reserva Cancelada.
		ReservaRepository despues = new ReservaRepository(carpeta.toString());
		Reserva tercera = despues.guardarSiDisponible(new Reserva(null, null, "b@ucab.edu.ve", 1L, HOY.plusDays(1), nueve(), nueve().plusHours(1), 1, EstadoReserva.ACTIVA))
				.orElseThrow();
		assertThat(tercera.codigo()).isEqualTo("RES-000003");
		assertThat(despues.listar().stream().map(Reserva::codigo).distinct().count()).isEqualTo(3);
	}

	private static LocalTime nueve() {
		return LocalTime.of(9, 0);
	}
}
