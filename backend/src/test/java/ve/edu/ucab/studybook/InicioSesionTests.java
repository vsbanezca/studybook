package ve.edu.ucab.studybook;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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
import ve.edu.ucab.studybook.model.Cuenta;
import ve.edu.ucab.studybook.model.Rol;

@SpringBootTest
@ActiveProfiles("test")
class InicioSesionTests {

	private static final String MIEMBRO = "miembro@test.dev";
	private static final String CLAVE_MIEMBRO = "Miembro-test-123";

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
		if (repositorio.buscarPorCorreo(MIEMBRO).isEmpty()) {
			repositorio.guardar(new Cuenta(null, "Miembro", "V-1", MIEMBRO, "0", encoder.encode(CLAVE_MIEMBRO), Rol.MIEMBRO));
		}
	}

	private MvcResult login(String correo, String clave) throws Exception {
		String cuerpo = "{\"correo\":\"%s\",\"clave\":\"%s\"}".formatted(correo, clave);
		return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(cuerpo)).andReturn();
	}

	private MockHttpSession sesionDe(String correo, String clave) throws Exception {
		MvcResult r = login(correo, clave);
		assertThat(r.getResponse().getStatus()).isEqualTo(200);
		return (MockHttpSession) r.getRequest().getSession(false);
	}

	@Test
	void miembroConCredencialesCorrectasRecibeSuRol() throws Exception {
		MvcResult r = login(MIEMBRO, CLAVE_MIEMBRO);
		assertThat(r.getResponse().getStatus()).isEqualTo(200);
		assertThat(r.getResponse().getContentAsString()).contains("\"rol\":\"MIEMBRO\"").doesNotContain("clave");
	}

	@Test
	void elCorreoNoDistingueMayusculasDeMinusculas() throws Exception {
		assertThat(login("MIEMBRO@Test.DEV", CLAVE_MIEMBRO).getResponse().getStatus()).isEqualTo(200);
	}

	@Test
	void administradorConCredencialesCorrectasRecibeSuRol() throws Exception {
		MvcResult r = login("admin@test.dev", "Admin-test-123");
		assertThat(r.getResponse().getStatus()).isEqualTo(200);
		assertThat(r.getResponse().getContentAsString()).contains("\"rol\":\"ADMINISTRADOR\"");
	}

	@Test
	void correoInexistenteYClaveIncorrectaDanLaMismaRespuesta() throws Exception {
		MvcResult sinCuenta = login("nadie@test.dev", "cualquiera");
		MvcResult claveMala = login(MIEMBRO, "incorrecta");
		assertThat(sinCuenta.getResponse().getStatus()).isEqualTo(401);
		assertThat(claveMala.getResponse().getStatus()).isEqualTo(401);
		assertThat(sinCuenta.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8))
				.isEqualTo(claveMala.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8))
				.contains("Correo o contraseña incorrectos");
	}

	@Test
	void camposVaciosIndicanElCampo() throws Exception {
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"correo\":\"\",\"clave\":\"\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.mensaje").value("Datos proporcionados incorrectos"))
				.andExpect(jsonPath("$.campos.correo").exists())
				.andExpect(jsonPath("$.campos.clave").exists());
	}

	@Test
	void correoConFormatoInvalidoIndicaElCampo() throws Exception {
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"correo\":\"no-es-correo\",\"clave\":\"x\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.correo").exists())
				.andExpect(jsonPath("$.campos.clave").doesNotExist());
	}

	@Test
	void miembroRecibe403EnRutaDeAdministracion() throws Exception {
		MockHttpSession sesion = sesionDe(MIEMBRO, CLAVE_MIEMBRO);
		mvc.perform(get("/api/admin/cualquier-cosa").session(sesion)).andExpect(status().isForbidden());
	}

	@Test
	void administradorNoRecibe403EnRutaDeAdministracion() throws Exception {
		MockHttpSession sesion = sesionDe("admin@test.dev", "Admin-test-123");
		// La ruta no existe todavia: pasa la autorizacion y responde 404, no 403.
		mvc.perform(get("/api/admin/cualquier-cosa").session(sesion)).andExpect(status().isNotFound());
	}

	@Test
	void sinSesionLasRutasProtegidasDan401() throws Exception {
		mvc.perform(get("/api/auth/sesion")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/admin/cualquier-cosa")).andExpect(status().isUnauthorized());
	}

	@Test
	void conSesionSePuedeRecuperarElUsuario() throws Exception {
		MockHttpSession sesion = sesionDe(MIEMBRO, CLAVE_MIEMBRO);
		mvc.perform(get("/api/auth/sesion").session(sesion))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.correo").value(MIEMBRO));
	}

	@Test
	void laClaveGuardadaNoEsTextoPlano() {
		Cuenta cuenta = repositorio.buscarPorCorreo(MIEMBRO).orElseThrow();
		assertThat(cuenta.clave()).isNotEqualTo(CLAVE_MIEMBRO).startsWith("$2");
		assertThat(encoder.matches(CLAVE_MIEMBRO, cuenta.clave())).isTrue();
	}
}
