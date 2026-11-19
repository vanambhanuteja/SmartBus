FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
# Reproducible: generate the SYNTHETIC dataset and train the model while building the image
RUN mkdir -p data models && python -m app.generate_dataset && python -m app.train
RUN useradd --system --uid 1001 appuser
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=3s --retries=5 CMD python -c "import urllib.request as u; u.urlopen('http://localhost:8000/health')" || exit 1
CMD ["gunicorn", "-b", "0.0.0.0:8000", "-w", "2", "app.main:app"]
