package tn.oliveconnect.unit;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import tn.oliveconnect.common.web.PageRequests;

class PageRequestsTest {

  @Test
  void capsOversizedPages() {
    Pageable pageable = PageRequests.of(0, 1_000_000);
    assertThat(pageable.getPageSize()).isEqualTo(PageRequests.MAX_PAGE_SIZE);
  }

  @Test
  void clampsNegativeOrZeroValues() {
    Pageable pageable = PageRequests.of(-3, 0);
    assertThat(pageable.getPageNumber()).isZero();
    assertThat(pageable.getPageSize()).isEqualTo(1);
  }

  @Test
  void keepsNormalValues() {
    Pageable pageable = PageRequests.of(2, 20);
    assertThat(pageable.getPageNumber()).isEqualTo(2);
    assertThat(pageable.getPageSize()).isEqualTo(20);
  }
}
