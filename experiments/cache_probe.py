"""Measure product-list latency without inventing a result.

Run the service twice under the same environment:
1) default profile (simple in-process cache)
2) --spring.profiles.active=redis

Save each run to a different CSV and compare p50/p95 plus DB query metrics.
"""

import argparse
import csv
import statistics
import time
from urllib.request import urlopen


def percentile(values, p):
    values = sorted(values)
    index = min(len(values) - 1, round((len(values) - 1) * p))
    return values[index]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:8080/api/v1/products")
    parser.add_argument("--requests", type=int, default=200)
    parser.add_argument("--output", default="cache_probe.csv")
    args = parser.parse_args()

    latencies = []
    for _ in range(args.requests):
        started = time.perf_counter()
        with urlopen(args.url) as response:
            response.read()
        latencies.append((time.perf_counter() - started) * 1000)

    with open(args.output, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["request", "latency_ms"])
        writer.writerows(enumerate(latencies, start=1))

    print({
        "requests": len(latencies),
        "mean_ms": round(statistics.fmean(latencies), 2),
        "p50_ms": round(percentile(latencies, 0.50), 2),
        "p95_ms": round(percentile(latencies, 0.95), 2),
    })


if __name__ == "__main__":
    main()
