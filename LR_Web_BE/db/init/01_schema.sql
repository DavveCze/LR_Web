CREATE TABLE dancers (
    idt SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    category_lat VARCHAR(10),
    category_stt VARCHAR(10),
    partner_idt INTEGER REFERENCES 
        dancers(idt) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE dance_pairs (
    pair_id SERIAL PRIMARY KEY,
    idt1 INTEGER NOT NULL REFERENCES dancers(idt),
    idt2 INTEGER NOT NULL REFERENCES dancers(idt),
    points INTEGER DEFAULT 0,
    finals BOOLEAN DEFAULT false,
    UNIQUE (idt1, idt2)
);

CREATE TABLE competition_results (
    id SERIAL PRIMARY KEY,
    pair_id INTEGER NOT NULL REFERENCES dance_pairs(pair_id),
    competition_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    placement VARCHAR(50) NOT NULL
);

CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    headline VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    headline VARCHAR(255) NOT NULL,
    content TEXT,
    link VARCHAR(255),
    cost VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);