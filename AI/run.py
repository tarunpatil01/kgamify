import os
import uvicorn

from main import app


if __name__ == "__main__":
    # Render injects PORT. Fallback to 10000 for local/manual runs.
    port = int(os.getenv("PORT", "10000"))
    uvicorn.run(app, host="0.0.0.0", port=port, workers=1, log_level="debug")
