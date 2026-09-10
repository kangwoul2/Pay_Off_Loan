"""Send concurrent updates with the same expectedVersion.

Expected observation after one product exists:
- one request can commit the versioned update
- stale concurrent requests receive HTTP 409

This script reports actual status codes only; it does not generate synthetic results.
"""

import argparse
import json
from concurrent.futures import ThreadPoolExecutor
from urllib.error import HTTPError
from urllib.request import Request, urlopen


def patch(url, value, version):
    body = json.dumps({"value": value, "expectedVersion": version}).encode()
    request = Request(url, data=body, method="PATCH", headers={"Content-Type": "application/json"})
    try:
        with urlopen(request) as response:
            return response.status, response.read().decode()
    except HTTPError as exc:
        return exc.code, exc.read().decode()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--product-id", type=int, required=True)
    parser.add_argument("--version", type=int, required=True)
    parser.add_argument("--workers", type=int, default=10)
    args = parser.parse_args()
    url = f"http://localhost:8080/api/v1/products/{args.product_id}/rate"

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(lambda _: patch(url, "3.7500", args.version), range(args.workers)))

    counts = {}
    for status, _ in results:
        counts[status] = counts.get(status, 0) + 1
    print({"status_counts": counts})


if __name__ == "__main__":
    main()
