import http from "k6/http";
import { check, sleep } from "k6";

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 50 }, // Ramp up to 50 users
    { duration: "1m", target: 50 }, // Stay at 50 users for 1 minute
    { duration: "30s", target: 100 }, // Ramp up to 100 users
    { duration: "1m", target: 100 }, // Stay at 100 users for 1 minute
    { duration: "30s", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
    "checks{type:redirect}": ["rate>0.95"], // 95% success rate
  },
};

const SHORTENED_URL = "http://localhost:8080/mikubeam";

export default function () {
  const res = http.get(SHORTENED_URL, {
    tags: { type: "redirect" },
    redirects: 0, // Don't follow redirects to measure just the redirect response
  });

  // Check if we got a redirect status (307)
  check(
    res,
    {
      "status is 307": (r) => r.status === 307,
      "has location header": (r) => r.headers["Location"] !== undefined,
    },
    { type: "redirect" }
  );

  sleep(1); // Add some think time between requests
}

