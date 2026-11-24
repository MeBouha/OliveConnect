package tn.oliveconnect.common.web;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/** Builds bounded page requests from untrusted query parameters. */
public final class PageRequests {

  public static final int MAX_PAGE_SIZE = 100;

  private PageRequests() {
  }

  public static Pageable of(int page, int size) {
    return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
  }
}
