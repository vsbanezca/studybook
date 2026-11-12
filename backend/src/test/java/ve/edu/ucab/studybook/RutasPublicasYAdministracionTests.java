package ve.edu.ucab.studybook;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import ve.edu.ucab.studybook.control.cuenta.CuentaRepository;
import ve.edu.ucab.studybook.model.Cuenta;
import ve.edu.ucab.studybook.model.Rol;

/** Que rutas se pueden usar sin sesion y cuales exigen Administrador. */
@SpringBootTest
@ActiveProfiles("test")
class RutasPublicasYAdministracionTests {

	private static final String MIEMBRO = "miembro-rutas@test.dev";
	private static final String CLAVE = "Miembro-test-123";

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
			repositorio.guardar(new Cuenta(null, "Miembro", "V-3", MIEMBRO, "0", encoder.encode(CLAVE), Rol.MIEMBRO));
		}
	}

	private MockHttpSession sesion(String correo, String clave) throws Exception {
		String cuerpo = "{\"correo\":\"%s\",\"clave\":\"%s\"}".formatted(correo, clave);
		MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(cuerpo)).andReturn();
		assertThat(r.getResponse().getStatus()).isEqualTo(200);
		return (MockHttpSession) r.getRequest().getSession(false);
	}

	private int estado(MockHttpServletRequestBuilder peticion, MockHttpSession sesion) throws Exception {
		if (sesion != null) {
			peticion.session(sesion);
		}
		return mvc.perform(peticion.contentType(MediaType.APPLICATION_JSON).content("{}")).andReturn().getResponse().getStatus();
	}

	@Test
	void registroNoExigeSesion() throws Exception {
		assertThat(estado(post("/api/auth/registro"), null)).isNotEqualTo(401);
	}

	@Test
	void elRestoDeLaApiSigueExigiendoSesion() throws Exception {
		assertThat(estado(get("/api/espacios"), null)).isEqualTo(401);
		assertThat(estado(get("/api/auth/sesion"), null)).isEqualTo(401);
		assertThat(estado(get("/api/reservas/mias"), null)).isEqualTo(401);
	}

	@Test
	void rutasDeAdministracionSonSoloParaAdministrador() throws Exception {
		MockHttpSession miembro = sesion(MIEMBRO, CLAVE);
		assertThat(estado(get("/api/admin/cualquier-cosa"), miembro)).isEqualTo(403);
		assertThat(estado(post("/api/admin/cualquier-cosa"), miembro)).isEqualTo(403);
		assertThat(estado(post("/api/equipamientos"), miembro)).isEqualTo(403);
		assertThat(estado(post("/api/espacios"), miembro)).isEqualTo(403);
		assertThat(estado(get("/api/admin/cualquier-cosa"), null)).isEqualTo(401);
	}

	@Test
	void elAdministradorPasaLaAutorizacionDeAdministracion() throws Exception {
		MockHttpSession admin = sesion("admin@test.dev", "Admin-test-123");
		assertThat(estado(get("/api/admin/cualquier-cosa"), admin)).isNotIn(401, 403);
	}
}
