CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS products_semantic (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    image_url TEXT,
    description_vector vector(768)
);

CREATE INDEX IF NOT EXISTS products_semantic_vector_idx ON products_semantic USING hnsw (description_vector vector_cosine_ops);

-- Insert dummy data (using mock vectors initialized with a constant, in reality, these come from Gemini)
INSERT INTO products_semantic (name, description, price, image_url, description_vector) 
VALUES
('Batik Tulis Madura', 'Batik tulis asli Madura dengan motif floral yang indah dan warna cerah, cocok untuk acara formal dan kasual.', 450000.00, 'https://btdfzxttyknywewfkayw.supabase.co/storage/v1/object/public/gambarBatik/mock1.jpg', array_fill(0.1::float, ARRAY[768])::vector),
('Batik Cap Pekalongan', 'Batik cap khas Pekalongan dengan bahan katun primissima yang adem dan nyaman dipakai seharian.', 250000.00, 'https://btdfzxttyknywewfkayw.supabase.co/storage/v1/object/public/gambarBatik/mock2.jpg', array_fill(0.2::float, ARRAY[768])::vector),
('Kemeja Batik Solo Premium', 'Kemeja lengan panjang bermotif Parang dari Solo. Desain elegan untuk pakaian kerja atau undangan.', 350000.00, 'https://btdfzxttyknywewfkayw.supabase.co/storage/v1/object/public/gambarBatik/mock3.jpg', array_fill(0.3::float, ARRAY[768])::vector);
