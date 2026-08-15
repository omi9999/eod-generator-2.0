#!/usr/bin/env python3
"""
Launches backend (uvicorn) and frontend (npm run dev) in parallel.
Press Ctrl+C to stop both.
"""
import subprocess
import sys
import os
import time

def run_servers():
    backend_cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"]
    frontend_cmd = ["npm", "run", "dev"]

    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")

    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )

    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )

    print("✅ Backend starting on http://localhost:8000")
    print("✅ Frontend starting on http://localhost:3000")
    print("Press Ctrl+C to stop both servers.\n")

    def print_output(proc, name):
        for line in iter(proc.stdout.readline, ''):
            print(f"[{name}] {line}", end='')

    import threading
    t1 = threading.Thread(target=print_output, args=(backend_proc, "BACKEND"))
    t2 = threading.Thread(target=print_output, args=(frontend_proc, "FRONTEND"))
    t1.daemon = True
    t2.daemon = True
    t1.start()
    t2.start()

    try:
        while True:
            if backend_proc.poll() is not None or frontend_proc.poll() is not None:
                break
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()
        print("Servers stopped.")

if __name__ == "__main__":
    run_servers()
