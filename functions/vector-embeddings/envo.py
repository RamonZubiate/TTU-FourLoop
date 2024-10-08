import sys
import site
import subprocess

def verify_environment():
    # Print Python executable path
    print(f"Python executable: {sys.executable}")

    # Print site-packages directory
    site_packages = site.getsitepackages()[0]
    print(f"Site-packages: {site_packages}")

    # Check if we're in a virtual environment
    in_venv = sys.prefix != sys.base_prefix
    print(f"In virtual environment: {in_venv}")

    # Get pip version
    try:
        pip_version = subprocess.check_output([sys.executable, "-m", "pip", "--version"]).decode().strip()
        print(f"Pip version: {pip_version}")
    except subprocess.CalledProcessError:
        print("Pip not found or not accessible")

    # List installed packages
    print("\nInstalled packages:")
    subprocess.run([sys.executable, "-m", "pip", "list"])

if __name__ == "__main__":
    verify_environment()