package ve.edu.ucab.studybook;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

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

@SpringBootTest
@ActiveProfiles("test")
class AutorizacionEspaciosTests {

	private static final String MIEMBRO = "miembro-espacios@test.dev";
	private static final String CLAVE = "Miembro-test-123";
	private static final String ESPACIO = "{\"nombre\":\"Sala 1\",\"ubicacion\":\"Biblioteca\",\"piso\":\"2\",\"capacidad\":6}";

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
			repositorio.guardar(new Cuenta(null, "Miembro", "V-2", MIEMBRO, "0", encoder.encode(CLAVE), Rol.MIEMBRO));
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
		return mvc.perform(peticion.contentType(MediaType.APPLICATION_JSON).content(ESPACIO)).andReturn().getResponse().getStatus();
	}

	@Test
	void miembroRecibe403AlCrearModificarOEliminarEspacios() throws Exception {
		MockHttpSession miembro = sesion(MIEMBRO, CLAVE);
		assertThat(estado(post("/api/espacios"), miembro)).isEqualTo(403);
		assertThat(estado(put("/api/espacios/1"), miembro)).isEqualTo(403);
		assertThat(estado(delete("/api/espacios/1"), miembro)).isEqualTo(403);
	}

	@Test
	void administradorPuedeCrearEspacios() throws Exception {
		MockHttpSession admin = sesion("admin@test.dev", "Admin-test-123");
		assertThat(estado(post("/api/espacios"), admin)).isEqualTo(200);
		// PUT y DELETE aun no tienen funcion: pasan la autorizacion (no son 401 ni 403).
		assertThat(estado(put("/api/espacios/1"), admin)).isNotIn(401, 403);
		assertThat(estado(delete("/api/espacios/1"), admin)).isNotIn(401, 403);
	}

	@Test
	void miembroYAdministradorPuedenConsultarEspacios() throws Exception {
		assertThat(estado(get("/api/espacios"), sesion(MIEMBRO, CLAVE))).isEqualTo(200);
		assertThat(estado(get("/api/espacios"), sesion("admin@test.dev", "Admin-test-123"))).isEqualTo(200);
	}

	@Test
	void sinSesionLosEspaciosDan401() throws Exception {
		assertThat(estado(get("/api/espacios"), null)).isEqualTo(401);
		assertThat(estado(post("/api/espacios"), null)).isEqualTo(401);
	}
}
