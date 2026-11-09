package ve.edu.ucab.studybook;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
class ValidacionEspaciosTests {

	@Autowired
	WebApplicationContext contexto;

	MockMvc mvc;
	MockHttpSession admin;

	@BeforeEach
	void preparar() throws Exception {
		mvc = MockMvcBuilders.webAppContextSetup(contexto).build();
		MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"correo\":\"admin@test.dev\",\"clave\":\"Admin-test-123\"}")).andReturn();
		admin = (MockHttpSession) r.getRequest().getSession(false);
	}

	MockHttpServletResponse crear(String json) throws Exception {
		return mvc.perform(post("/api/espacios").session(admin).contentType(MediaType.APPLICATION_JSON).content(json))
				.andReturn().getResponse();
	}

	static String json(String nombre, String ubicacion, String piso, int capacidad) {
		return "{\"nombre\":%s,\"ubicacion\":%s,\"piso\":%s,\"capacidad\":%d}".formatted(q(nombre), q(ubicacion), q(piso),
				capacidad);
	}

	private static String q(String s) {
		return s == null ? "null" : "\"" + s + "\"";
	}

	@ParameterizedTest
	@CsvSource({ "'',U,1,nombre", "'   ',U,1,nombre", "N,'',1,ubicacion", "N,'  ',1,ubicacion", "N,U,'',piso",
			"N,U,'   ',piso" })
	void campoObligatorioVacioDa400IndicandoElCampo(String nombre, String ubicacion, String piso, String campo)
			throws Exception {
		MockHttpServletResponse r = crear(json(nombre, ubicacion, piso, 4));
		assertThat(r.getStatus()).isEqualTo(400);
		assertThat(r.getContentAsString()).contains("\"" + campo + "\":\"Este campo es obligatorio.\"");
	}

	@Test
	void campoAusenteDa400() throws Exception {
		MockHttpServletResponse r = crear("{\"ubicacion\":\"U\",\"piso\":\"1\",\"capacidad\":4}");
		assertThat(r.getStatus()).isEqualTo(400);
		assertThat(r.getContentAsString()).contains("\"nombre\":\"Este campo es obligatorio.\"");
	}

	@ParameterizedTest
	@CsvSource({ "0", "-3" })
	void capacidadMenorQueUnoDa400(int capacidad) throws Exception {
		MockHttpServletResponse r = crear(json("N", "U", "1", capacidad));
		assertThat(r.getStatus()).isEqualTo(400);
		assertThat(r.getContentAsString()).contains("La capacidad debe ser un número entero mayor que 0");
	}

	@Test
	void capacidadNoEnteraDa400() throws Exception {
		MockHttpServletResponse r = crear("{\"nombre\":\"N\",\"ubicacion\":\"U\",\"piso\":\"1\",\"capacidad\":2.5}");
		assertThat(r.getStatus()).isEqualTo(400);
	}

	@Test
	void duplicadoDa400ConElMensajeLiteralYSeToleraMayusculasYEspacios() throws Exception {
		assertThat(crear(json("Sala dup", "Biblioteca dup", "1", 4)).getStatus()).isEqualTo(200);
		for (String cuerpo : new String[] { json("Sala dup", "Biblioteca dup", "2", 8),
				json("  SALA DUP ", " biblioteca DUP  ", "1", 4) }) {
			MockHttpServletResponse r = crear(cuerpo);
			assertThat(r.getStatus()).isEqualTo(400);
			assertThat(r.getContentAsString()).contains("Ya existe un espacio con ese nombre en esa ubicación");
		}
	}

	@Test
	void mismoNombreEnOtraUbicacionSePermite() throws Exception {
		assertThat(crear(json("Sala otra", "Ubicacion A", "1", 4)).getStatus()).isEqualTo(200);
		assertThat(crear(json("Sala otra", "Ubicacion B", "1", 4)).getStatus()).isEqualTo(200);
	}
}
