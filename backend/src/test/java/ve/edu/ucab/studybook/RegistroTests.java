package ve.edu.ucab.studybook;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import ve.edu.ucab.studybook.control.cuenta.CuentaRepository;
import ve.edu.ucab.studybook.model.Cuenta;
import ve.edu.ucab.studybook.model.Rol;

/** Historia Registrarse: validaciones, duplicados, rol forzado a Miembro y clave cifrada. */
@SpringBootTest
@ActiveProfiles("test")
class RegistroTests {

	private static final String CLAVE = "Clave-segura-1";
	private static final AtomicInteger CONTADOR = new AtomicInteger(1000);

	@Autowired
	WebApplicationContext contexto;
	@Autowired
	CuentaRepository repositorio;
	@Autowired
	PasswordEncoder encoder;

	MockMvc mvc;

	@BeforeEach
	void preparar() {
		mvc = MockMvcBuilders.webAppContextSetup(contexto).build();
	}

	/** Cada prueba usa una cedula y un correo propios para no depender del orden. */
	private record Datos(String nombre, String cedula, String correo, String telefono, String clave) {
		String json() {
			return "{\"nombre\":%s,\"cedula\":%s,\"correo\":%s,\"telefono\":%s,\"clave\":%s}".formatted(
					comillas(nombre), comillas(cedula), comillas(correo), comillas(telefono), comillas(clave));
		}

		Datos con(String campo, String valor) {
			return new Datos(
					campo.equals("nombre") ? valor : nombre,
					campo.equals("cedula") ? valor : cedula,
					campo.equals("correo") ? valor : correo,
					campo.equals("telefono") ? valor : telefono,
					campo.equals("clave") ? valor : clave);
		}

		private static String comillas(String v) {
			return v == null ? "null" : "\"" + v.replace("\"", "\\\"") + "\"";
		}
	}

	private static Datos validos() {
		int n = CONTADOR.incrementAndGet();
		return new Datos("Ana Pérez", String.valueOf(10_000_000 + n), "ana" + n + "@ucab.edu.ve", "+584141234567", CLAVE);
	}

	private MvcResult registrar(String cuerpo) throws Exception {
		return mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON).content(cuerpo)).andReturn();
	}

	private void esperaRechazo(Datos datos, String campo, String mensaje) throws Exception {
		MvcResult r = registrar(datos.json());
		assertThat(r.getResponse().getStatus()).as("estado para %s", campo).isEqualTo(400);
		String cuerpo = r.getResponse().getContentAsString();
		assertThat(cuerpo).contains("\"" + campo + "\"").contains(mensaje);
	}

	@Test
	void registroValidoCreaUnMiembroSinIniciarSesion() throws Exception {
		Datos d = validos();
		MvcResult r = registrar(d.json());
		assertThat(r.getResponse().getStatus()).isEqualTo(201);
		assertThat(r.getResponse().getContentAsString()).contains("MIEMBRO").contains(d.correo());
		// Registrar no inicia sesion: no hay sesion creada y /sesion responde 401.
		assertThat(r.getRequest().getSession(false)).isNull();
		assertThat(mvc.perform(get("/api/auth/sesion")).andReturn().getResponse().getStatus()).isEqualTo(401);
	}

	@Test
	void laRespuestaNuncaIncluyeLaClave() throws Exception {
		Datos d = validos();
		String cuerpo = registrar(d.json()).getResponse().getContentAsString();
		assertThat(cuerpo).doesNotContain(CLAVE).doesNotContain("clave").doesNotContain("$2");
	}

	@Test
	void laCuentaNuevaPuedeIniciarSesion() throws Exception {
		Datos d = validos();
		assertThat(registrar(d.json()).getResponse().getStatus()).isEqualTo(201);
		String login = "{\"correo\":\"%s\",\"clave\":\"%s\"}".formatted(d.correo(), CLAVE);
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.rol").value("MIEMBRO"));
	}

	@Test
	void sinSesionElRegistroNoDa401() throws Exception {
		assertThat(registrar(validos().json()).getResponse().getStatus()).isNotEqualTo(401);
	}

	@Test
	void elRolSiempreEsMiembroAunqueLaPeticionPidaAdministrador() throws Exception {
		Datos d = validos();
		String conRol = d.json().replace("}", ",\"rol\":\"ADMINISTRADOR\"}");
		MvcResult r = registrar(conRol);
		assertThat(r.getResponse().getStatus()).isEqualTo(201);
		assertThat(r.getResponse().getContentAsString()).contains("MIEMBRO").doesNotContain("ADMINISTRADOR");
		assertThat(repositorio.buscarPorCorreo(d.correo())).get().extracting(Cuenta::rol).isEqualTo(Rol.MIEMBRO);
	}

	@Test
	void laClaveSeGuardaCifradaYNuncaEnTextoPlano() throws Exception {
		Datos d = validos();
		registrar(d.json());
		Cuenta guardada = repositorio.buscarPorCorreo(d.correo()).orElseThrow();
		assertThat(guardada.clave()).isNotEqualTo(CLAVE).doesNotContain(CLAVE).startsWith("$2");
		assertThat(encoder.matches(CLAVE, guardada.clave())).isTrue();
	}

	@Test
	void correoRepetidoSeRechazaConUnMensajeClaro() throws Exception {
		Datos d = validos();
		assertThat(registrar(d.json()).getResponse().getStatus()).isEqualTo(201);
		// Mismo correo con otra cedula y con mayusculas: sigue siendo el mismo correo.
		MvcResult r = registrar(d.con("cedula", "99999001").con("correo", d.correo().toUpperCase()).json());
		assertThat(r.getResponse().getStatus()).isEqualTo(400);
		assertThat(r.getResponse().getContentAsString()).contains("correo_registrado");
	}

	@Test
	void cedulaRepetidaSeRechazaConUnMensajeDistintoAlDelCorreo() throws Exception {
		Datos d = validos();
		assertThat(registrar(d.json()).getResponse().getStatus()).isEqualTo(201);
		MvcResult r = registrar(d.con("correo", "otro" + d.cedula() + "@est.ucab.edu.ve").json());
		assertThat(r.getResponse().getStatus()).isEqualTo(400);
		String cuerpo = r.getResponse().getContentAsString();
		assertThat(cuerpo).contains("cedula_registrada").doesNotContain("correo_registrado");
	}

	@Test
	void unRegistroRepetidoNoCreaUnaSegundaCuenta() throws Exception {
		Datos d = validos();
		assertThat(registrar(d.json()).getResponse().getStatus()).isEqualTo(201);
		String primerHash = repositorio.buscarPorCorreo(d.correo()).orElseThrow().clave();
		assertThat(registrar(d.con("clave", "Otra-clave-99").json()).getResponse().getStatus()).isEqualTo(400);
		// La cuenta original no cambio (misma clave cifrada) y la cedula sigue ocupada.
		assertThat(repositorio.buscarPorCorreo(d.correo()).orElseThrow().clave()).isEqualTo(primerHash);
		assertThat(registrar(d.con("correo", "x" + d.correo()).json()).getResponse().getStatus()).isEqualTo(400);
	}

	@Test
	void cadaCampoEsObligatorioYLaRespuestaIndicaElCampoConUnCodigo() throws Exception {
		esperaRechazo(validos().con("nombre", "  "), "nombre", "obligatorio");
		esperaRechazo(validos().con("cedula", ""), "cedula", "obligatorio");
		esperaRechazo(validos().con("correo", null), "correo", "obligatorio");
		esperaRechazo(validos().con("telefono", " "), "telefono", "obligatorio");
		esperaRechazo(validos().con("clave", ""), "clave", "obligatorio");
	}

	@Test
	void laCedulaDebeSerNumerica() throws Exception {
		esperaRechazo(validos().con("cedula", "V-12345678"), "cedula", "formato");
		esperaRechazo(validos().con("cedula", "12a45"), "cedula", "formato");
	}

	@Test
	void elCorreoDebeTenerFormatoValido() throws Exception {
		esperaRechazo(validos().con("correo", "no-es-correo"), "correo", "formato");
		esperaRechazo(validos().con("correo", "a b@ucab.edu.ve"), "correo", "formato");
	}

	@Test
	void soloSeAceptanLosDominiosInstitucionalesConfigurados() throws Exception {
		esperaRechazo(validos().con("correo", "ana@gmail.com"), "correo", "dominio_no_institucional");
		// Un subdominio no listado o un dominio que solo termina igual tampoco vale.
		esperaRechazo(validos().con("correo", "ana@x.ucab.edu.ve"), "correo", "dominio_no_institucional");
		esperaRechazo(validos().con("correo", "ana@falsoucab.edu.ve"), "correo", "dominio_no_institucional");
		// Los dos dominios iniciales funcionan.
		assertThat(registrar(validos().json()).getResponse().getStatus()).isEqualTo(201);
		Datos estudiante = validos();
		assertThat(registrar(estudiante.con("correo", "est" + estudiante.cedula() + "@est.ucab.edu.ve").json())
				.getResponse().getStatus()).isEqualTo(201);
	}

	@Test
	void elTelefonoSeNormalizaYSeGuardaSinSeparadores() throws Exception {
		String[][] casos = {
				{"0412-123 4567", "04121234567"},
				{"+58 412 1234567", "+584121234567"},
				{"(0412) 1234567", "04121234567"},
				{"  0412 - 123 - 4567 ", "04121234567"},
				{"04121234567", "04121234567"},
		};
		for (String[] caso : casos) {
			Datos d = validos().con("telefono", caso[0]);
			assertThat(registrar(d.json()).getResponse().getStatus()).as(caso[0]).isEqualTo(201);
			assertThat(repositorio.buscarPorCorreo(d.correo()).orElseThrow().telefono()).as(caso[0]).isEqualTo(caso[1]);
		}
	}

	@Test
	void elTelefonoInvalidoSeRechazaDespuesDeNormalizar() throws Exception {
		String mensaje = "formato";
		esperaRechazo(validos().con("telefono", "0412-123a567"), "telefono", mensaje);
		esperaRechazo(validos().con("telefono", "04141234"), "telefono", mensaje);
		esperaRechazo(validos().con("telefono", "0414 123 4567 8901 2345"), "telefono", mensaje);
		esperaRechazo(validos().con("telefono", "+-+"), "telefono", mensaje);
		esperaRechazo(validos().con("telefono", "04141+234567"), "telefono", mensaje);
		esperaRechazo(validos().con("telefono", "-  -"), "telefono", mensaje);
	}

	@Test
	void ElDominioDelCorreoSeCompletaExactoSinDistinguirMayusculas() throws Exception {
		String mensaje = "dominio_no_institucional";
		for (String falso : new String[] { "x@ucab.edu.ve.malo.com", "x@malo.com", "x@xucab.edu.ve", "x@sub.ucab.edu.ve",
				"x@ucab.edu.vee", "x@ucab.edu", "x@malo.com.ucab.edu.ve" }) {
			esperaRechazo(validos().con("correo", falso), "correo", mensaje);
		}
		Datos mayusculas = validos();
		assertThat(registrar(mayusculas.con("correo", "X" + mayusculas.cedula() + "@UCAB.EDU.VE").json()).getResponse().getStatus())
				.isEqualTo(201);
		Datos estudiante = validos();
		assertThat(registrar(estudiante.con("correo", "Y" + estudiante.cedula() + "@Est.Ucab.Edu.Ve").json()).getResponse().getStatus())
				.isEqualTo(201);
	}

	@Test
	void unCorreoConDosArrobasNoPasaElFormato() throws Exception {
		esperaRechazo(validos().con("correo", "x@malo.com@ucab.edu.ve"), "correo", "formato");
	}

	@Test
	void laCedulaNoAceptaVacioNiLetras() throws Exception {
		esperaRechazo(validos().con("cedula", ""), "cedula", "obligatorio");
		esperaRechazo(validos().con("cedula", "   "), "cedula", "obligatorio");
		esperaRechazo(validos().con("cedula", "12345a78"), "cedula", "formato");
		esperaRechazo(validos().con("cedula", "V12345678"), "cedula", "formato");
	}

	@Test
	void laClaveDebeTenerAlMenos8Caracteres() throws Exception {
		esperaRechazo(validos().con("clave", "corta12"), "clave", "longitud_minima");
		assertThat(registrar(validos().con("clave", "exacto88").json()).getResponse().getStatus()).isEqualTo(201);
	}

	@Test
	void unaClaveMasLargaQueLoQueBcryptAceptaSeRechazaEnVezDeTruncarse() throws Exception {
		esperaRechazo(validos().con("clave", "x".repeat(73)), "clave", "longitud_maxima");
	}

	@Test
	void unDuplicadoSigueConElTextoDelServidorEIndicaElCampo() throws Exception {
		Datos d = validos();
		assertThat(registrar(d.json()).getResponse().getStatus()).isEqualTo(201);
		String porCorreo = registrar(d.con("cedula", d.cedula() + "1").json()).getResponse().getContentAsString();
		assertThat(porCorreo).startsWith("{\"mensaje\":\"correo_registrado\"")
				.contains("\"correo\":\"correo_registrado\"");
		String porCedula = registrar(d.con("correo", "otro" + d.correo()).json()).getResponse().getContentAsString();
		assertThat(porCedula).contains("\"cedula\":\"cedula_registrada\"");
	}

	@Test
	void sinLaPantallaLaRedDeSeguridadRespondeTodosLosCamposConError() throws Exception {
		MvcResult r = registrar("{}");
		assertThat(r.getResponse().getStatus()).isEqualTo(400);
		String cuerpo = r.getResponse().getContentAsString();
		assertThat(cuerpo).contains("datos_invalidos");
		for (String campo : new String[] { "nombre", "cedula", "correo", "telefono", "clave" }) {
			assertThat(cuerpo).contains("\"" + campo + "\":\"obligatorio\"");
		}
	}

	@Test
	void unCuerpoIlegibleDa400SinDetallesInternos() throws Exception {
		MvcResult r = registrar("esto no es json");
		assertThat(r.getResponse().getStatus()).isEqualTo(400);
		assertThat(r.getResponse().getContentAsString()).contains("datos_invalidos");
	}

	@Test
	void respondeEnMenosDe3Segundos() throws Exception {
		Datos d = validos();
		long inicio = System.nanoTime();
		MvcResult r = registrar(d.json());
		long milisegundos = (System.nanoTime() - inicio) / 1_000_000;
		assertThat(r.getResponse().getStatus()).isEqualTo(201);
		assertThat(milisegundos).isLessThan(3000);
	}

	@Test
	void dosRegistrosSimultaneosConElMismoCorreoCreanUnaSolaCuenta() throws Exception {
		Datos d = validos();
		java.util.concurrent.ExecutorService hilos = java.util.concurrent.Executors.newFixedThreadPool(2);
		try {
			var a = hilos.submit(() -> registrar(d.json()).getResponse().getStatus());
			var b = hilos.submit(() -> registrar(d.con("cedula", d.cedula() + "7").json()).getResponse().getStatus());
			assertThat(java.util.List.of(a.get(), b.get())).containsExactlyInAnyOrder(201, 400);
		}
		finally {
			hilos.shutdownNow();
		}
	}
}
