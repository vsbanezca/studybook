package ve.edu.ucab.studybook.control.comun;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Reloj de la aplicacion con la zona horaria configurable (studybook.zona-horaria). Las reglas que dependen
 * de "hoy" y de "ahora" lo usan en vez de llamar a now() para poder probarlas con un reloj fijo.
 */
@Configuration
public class RelojConfig {

	@Bean
	public Clock reloj(@Value("${studybook.zona-horaria}") String zona) {
		return Clock.system(ZoneId.of(zona));
	}
}
