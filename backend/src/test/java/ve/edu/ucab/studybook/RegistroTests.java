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
		assertThat(r.getResponse().getContentAsString()).contains("Ya existe una cuenta con ese correo");
	}

	@Test
	void cedulaRepetidaSeRechazaConUnMensajeDistintoAlDelCorreo() throws Exception {
		Datos d = validos();
		assertThat(registrar(d.json()).getResponse().getStatus()).isEqualTo(201);
		MvcResult r = registrar(d.con("correo", "otro" + d.cedula() + "@est.ucab.edu.ve").json());
		assertThat(r.getResponse().getStatus()).isEqualTo(400);
		String cuerpo = r.getResponse().getContentAsString();
		assertThat(cuerpo).contains("Ya existe una cuenta con esa cédula").doesNotContain("con ese correo");
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
	void cadaCampoEsObligatorioYElMensajeIndicaElCampo() throws Exception {
		esperaRechazo(validos().con("nombre", "  "), "nombre", "El nombre es obligatorio");
		esperaRechazo(validos().con("cedula", ""), "cedula", "La cédula es obligatoria");
		esperaRechazo(validos().con("correo", null), "correo", "El correo es obligatorio");
		esperaRechazo(validos().con("telefono", " "), "telefono", "El teléfono es obligatorio");
		esperaRechazo(validos().con("clave", ""), "clave", "La contraseña es obligatoria");
	}

	@Test
	void laCedulaDebeSerNumerica() throws Exception {
		esperaRechazo(validos().con("cedula", "V-12345678"), "cedula", "La cédula debe tener solo números");
		esperaRechazo(validos().con("cedula", "12a45"), "cedula", "La cédula debe tener solo números");
	}

	@Test
	void elCorreoDebeTenerFormatoValido() throws Exception {
		esperaRechazo(validos().con("correo", "no-es-correo"), "correo", "formato de correo electrónico");
		esperaRechazo(validos().con("correo", "a b@ucab.edu.ve"), "correo", "formato de correo electrónico");
	}

	@Test
	void soloSeAceptanLosDominiosInstitucionalesConfigurados() throws Exception {
		esperaRechazo(validos().con("correo", "ana@gmail.com"), "correo", "Usa tu correo institucional");
		// Un subdominio no listado o un dominio que solo termina igual tampoco vale.
		esperaRechazo(validos().con("correo", "ana@x.ucab.edu.ve"), "correo", "Usa tu correo institucional");
		esperaRechazo(validos().con("correo", "ana@falsoucab.edu.ve"), "correo", "Usa tu correo institucional");
		// Los dos dominios iniciales funcionan.
		assertThat(registrar(validos().json()).getResponse().getStatus()).isEqualTo(201);
		Datos estudiante = validos();
		assertThat(registrar(estudiante.con("correo", "est" + estudiante.cedula() + "@est.ucab.edu.ve").json())
				.getResponse().getStatus()).isEqualTo(201);
	}

	@Test
	void elTelefonoSoloAceptaDigitosConMasOpcionalDe10a15Caracteres() throws Exception {
		String mensaje = "El teléfono debe tener de 10 a 15 dígitos";
		esperaRechazo(validos().con("telefono", "04141234"), "telefono", mensaje);
		esperaRechazo(validos().con("telefono", "0414-1234567"), "telefono", mensaje);
		esperaRechazo(validos().con("telefono", "04141234567890123"), "telefono", mensaje);
		esperaRechazo(validos().con("telefono", "0414123456a"), "telefono", mensaje);
		assertThat(registrar(validos().con("telefono", "04141234567").json()).getResponse().getStatus()).isEqualTo(201);
	}

	@Test
	void laClaveDebeTenerAlMenos8Caracteres() throws Exception {
		esperaRechazo(validos().con("clave", "corta12"), "clave", "al menos 8 caracteres");
		assertThat(registrar(validos().con("clave", "exacto88").json()).getResponse().getStatus()).isEqualTo(201);
	}

	@Test
	void unaClaveMasLargaQueLoQueBcryptAceptaSeRechazaEnVezDeTruncarse() throws Exception {
		esperaRechazo(validos().con("clave", "x".repeat(73)), "clave", "como máximo 72 caracteres");
	}

	@Test
	void unCuerpoIlegibleDa400SinDetallesInternos() throws Exception {
		MvcResult r = registrar("esto no es json");
		assertThat(r.getResponse().getStatus()).isEqualTo(400);
		assertThat(r.getResponse().getContentAsString()).contains("Datos proporcionados incorrectos");
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
