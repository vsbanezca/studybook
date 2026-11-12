package ve.edu.ucab.studybook;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ve.edu.ucab.studybook.control.comun.Telefono;

class TelefonoTests {

	@Test
	void normalizaQuitandoEspaciosGuionesYParentesis() {
		assertThat(Telefono.normalizar("0412-123 4567")).isEqualTo("04121234567");
		assertThat(Telefono.normalizar("+58 412 1234567")).isEqualTo("+584121234567");
		assertThat(Telefono.normalizar("(0412) 1234567")).isEqualTo("04121234567");
		assertThat(Telefono.normalizar(null)).isEmpty();
	}

	@Test
	void validaElValorYaNormalizado() {
		assertThat(Telefono.esValido("0412-123 4567")).isTrue();
		assertThat(Telefono.esValido("+58 412 1234567")).isTrue();
		assertThat(Telefono.esValido("(0412) 1234567")).isTrue();
		assertThat(Telefono.esValido("0412-123a567")).isFalse();
		assertThat(Telefono.esValido("0412 123")).isFalse();
		assertThat(Telefono.esValido("1234567890123456")).isFalse();
		assertThat(Telefono.esValido("")).isFalse();
		assertThat(Telefono.esValido(null)).isFalse();
	}
}
