-- Migration: Seed Categories and Materials
-- Description: Adds initial data to categories and materials tables
-- Impacted Tables: categories, materials
-- Special Notes: This migration populates dictionary tables with common furniture categories and materials

-- Insert Categories
-- Common furniture categories for the ChairAI platform
INSERT INTO public.categories (name) VALUES
    ('Krzesła'),
    ('Stoły'),
    ('Szafy'),
    ('Komody'),
    ('Regały'),
    ('Biurka'),
    ('Łóżka'),
    ('Fotele'),
    ('Ławki'),
    ('Stoliki kawowe'),
    ('Szafki nocne'),
    ('Witryny')
ON CONFLICT (name) DO NOTHING;

-- Insert Materials
-- Common materials used in furniture making
INSERT INTO public.materials (name) VALUES
    ('Drewno dębowe'),
    ('Drewno bukowe'),
    ('Drewno sosnowe'),
    ('Drewno orzechowe'),
    ('Drewno jesionowe'),
    ('Metal'),
    ('Stal'),
    ('Aluminium'),
    ('Szkło'),
    ('MDF'),
    ('Płyta wiórowa'),
    ('Sklejka'),
    ('Ratan'),
    ('Wiklina'),
    ('Tkanina'),
    ('Skóra naturalna'),
    ('Skóra ekologiczna'),
    ('Tworzywo sztuczne'),
    ('Beton'),
    ('Marmur')
ON CONFLICT (name) DO NOTHING;

-- Insert Specializations (for artisans)
-- Common specializations that artisans can have
INSERT INTO public.specializations (name) VALUES
    ('Krzesła i fotele'),
    ('Stoły i biurka'),
    ('Szafy i meble przechowalne'),
    ('Meble tapicerowane'),
    ('Meble metalowe'),
    ('Meble szklane'),
    ('Meble ogrodowe'),
    ('Meble dziecięce'),
    ('Meble kuchenne'),
    ('Meble łazienkowe'),
    ('Renowacja mebli'),
    ('Stolarka artystyczna')
ON CONFLICT (name) DO NOTHING;
