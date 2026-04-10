package com.ticketing.ticketing_system;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
		"spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MySQL",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.mail.host=localhost",
		"spring.mail.port=3025",
		"app.jwt.secret=test-secret-key-that-is-at-least-256-bits-long-for-testing-purposes-only"
})
class TicketingApplicationTests {

	@Test
	void contextLoads() {
		// Verifies the Spring context assembles without errors
	}
}