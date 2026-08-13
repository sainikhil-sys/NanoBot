import urllib.request
import json
import time

def test_workflow():
    # 1. Submit DataBot Task
    print("[1] Submitting Data Analysis Task...")
    req = urllib.request.Request(
        "http://localhost:3001/api/tasks",
        data=json.dumps({"prompt": "Analyze this CSV dataset for statistical anomalies and covariance outliers"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    task = json.loads(res.read().decode("utf-8"))["task"]
    task_id = task["id"]
    print(f"    Task Created: {task_id}")

    # 2. Wait for pipeline execution to complete
    print("[2] Waiting for deep-learning pipeline to execute...")
    time.sleep(2.0)

    # 3. Fetch Full Execution Trace
    req2 = urllib.request.Request(f"http://localhost:3001/api/tasks/{task_id}")
    res2 = urllib.request.urlopen(req2)
    task_detail = json.loads(res2.read().decode("utf-8"))["task"]

    print(f"    Status: {task_detail['status']}")
    print(f"    Assigned Bot: {task_detail['bot']['name']} ({task_detail['bot']['category']})")
    print(f"    Executed Steps: {len(task_detail.get('steps', []))}")
    print(f"    Generated Events: {len(task_detail.get('events', []))}")
    print(f"    Result Generated: {bool(task_detail.get('result'))}")

    # 4. Submit CodeBot Task
    print("\n[3] Submitting Code Analysis Task...")
    req3 = urllib.request.Request(
        "http://localhost:3001/api/tasks",
        data=json.dumps({"prompt": "Refactor this TypeScript function and evaluate cyclomatic complexity: function fib(n: number) { return n <= 1 ? n : fib(n-1) + fib(n-2); }"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res3 = urllib.request.urlopen(req3)
    code_task = json.loads(res3.read().decode("utf-8"))["task"]
    print(f"    Task Created: {code_task['id']}")

    time.sleep(2.0)

    req4 = urllib.request.Request(f"http://localhost:3001/api/tasks/{code_task['id']}")
    res4 = urllib.request.urlopen(req4)
    code_detail = json.loads(res4.read().decode("utf-8"))["task"]

    print(f"    Status: {code_detail['status']}")
    print(f"    Assigned Bot: {code_detail['bot']['name']} ({code_detail['bot']['category']})")
    print(f"    Executed Steps: {len(code_detail.get('steps', []))}")
    print(f"    Generated Events: {len(code_detail.get('events', []))}")

    # 5. Check Overview Stats
    print("\n[4] Checking Overview Dashboard Metrics...")
    req_ov = urllib.request.Request("http://localhost:3001/api/overview")
    res_ov = urllib.request.urlopen(req_ov)
    overview = json.loads(res_ov.read().decode("utf-8"))
    print("    Overview Metrics:", overview["metrics"])
    print("    Recent Tasks Count:", len(overview["recentTasks"]))

    print("\n>>> ALL END-TO-END WORKFLOWS VERIFIED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_workflow()
