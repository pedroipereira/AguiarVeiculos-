insert into vehicles (slug, brand, model, version, year_model, year_fabrication, mileage_km, price_cents, fuel_type, transmission, color, description, is_featured, status, plate)
values
  ('vw-polo-2026', 'Volkswagen', 'Polo', 'Comfortline 200 TSI', 2026, 2025, 8000, 8990000, 'Flex', 'Automático', 'Branco', 'Praticamente zero km, único dono, revisado.', true, 'available', 'ABC1D23'),
  ('fiat-argo-2023', 'Fiat', 'Argo', 'Drive 1.0', 2023, 2023, 32000, 6490000, 'Flex', 'Manual', 'Prata', 'Carro de família, procedência garantida.', true, 'available', 'DEF4G56'),
  ('hyundai-hb20-2022', 'Hyundai', 'HB20', 'Comfort 1.0', 2022, 2022, 41000, 6190000, 'Flex', 'Manual', 'Vermelho', 'Revisado e higienizado, com garantia.', false, 'available', 'GHI7J89');

insert into testimonials (image_url, caption, display_order, is_published)
values ('https://placehold.co/600x600', 'Mais uma venda realizada na Aguiar Veículos! 🙏❤️', 1, true);
