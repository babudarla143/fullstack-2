# Use Miniconda base image
FROM continuumio/miniconda3

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Install system dependencies (for OpenCV etc.)
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libgl1-mesa-glx \
    libgl1 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copy all project files
COPY . .

# Create conda environment with Python 3.10
RUN conda create -n pest_env python=3.10 -y

# Install Python dependencies in the pest_env conda environment
RUN conda run -n pest_env pip install --upgrade pip && \
    conda run -n pest_env pip install --no-cache-dir -r requirements.txt

# Expose backend port
EXPOSE 5000

# Run FastAPI app using conda run
CMD ["conda", "run", "--no-capture-output", "-n", "pest_env", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
