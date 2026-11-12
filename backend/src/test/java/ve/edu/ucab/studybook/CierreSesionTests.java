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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/** Cerrar sesion: POST /api/auth/logout. */
@SpringBootTest
@ActiveProfiles("test")
class CierreSesionTests {

	@Autowired
	WebApplicationContext contexto;

	MockMvc mvc;

	@BeforeEach
	void preparar() {
		mvc = MockMvcBuilders.webAppContextSetup(contexto).build();
	}

	private MockHttpSession iniciarSesionAdministrador() throws Exception {
		String cuerpo = "{\"correo\":\"admin@test.dev\",\"clave\":\"Admin-test-123\"}";
		MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(cuerpo)).andReturn();
		assertThat(r.getResponse().getStatus()).isEqualTo(200);
		return (MockHttpSession) r.getRequest().getSession(false);
	}

	@Test
	void cerrarSesionResponde204AInvalidaLaSesion() throws Exception {
		MockHttpSession sesion = iniciarSesionAdministrador();
		assertThat(mvc.perform(get("/api/auth/sesion").session(sesion)).andReturn().getResponse().getStatus()).isEqualTo(200);

		MvcResult r = mvc.perform(post("/api/auth/logout").session(sesion)).andReturn();

		assertThat(r.getResponse().getStatus()).isEqualTo(204);
		assertThat(r.getResponse().getContentAsString()).isEmpty();
		assertThat(sesion.isInvalid()).isTrue();
	}

	@Test
	void despuesDeCerrarSesionLaMismaCookieYaNoSirve() throws Exception {
		MockHttpSession sesion = iniciarSesionAdministrador();
		mvc.perform(post("/api/auth/logout").session(sesion)).andReturn();
		// El navegador seguiria enviando la misma cookie: el servidor ya no la reconoce.
		assertThat(mvc.perform(get("/api/auth/sesion").session(sesion)).andReturn().getResponse().getStatus()).isEqualTo(401);
		assertThat(mvc.perform(get("/api/espacios").session(sesion)).andReturn().getResponse().getStatus()).isEqualTo(401);
	}

	@Test
	void sinSesionCerrarSesionDa401() throws Exception {
		assertThat(mvc.perform(post("/api/auth/logout")).andReturn().getResponse().getStatus()).isEqualTo(401);
	}

	@Test
	void cerrarSesionDosVecesNoFalla() throws Exception {
		MockHttpSession sesion = iniciarSesionAdministrador();
		assertThat(mvc.perform(post("/api/auth/logout").session(sesion)).andReturn().getResponse().getStatus()).isEqualTo(204);
		// La segunda vez la sesion ya no existe: es un 401 limpio, no un error del servidor.
		assertThat(mvc.perform(post("/api/auth/logout").session(sesion)).andReturn().getResponse().getStatus()).isEqualTo(401);
	}
}
