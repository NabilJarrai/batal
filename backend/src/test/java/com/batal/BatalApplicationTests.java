package com.batal;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "batal.jwt.secret=test-only-jwt-secret-not-used-outside-of-tests")
class BatalApplicationTests {

	@Test
	void contextLoads() {
	}

}
