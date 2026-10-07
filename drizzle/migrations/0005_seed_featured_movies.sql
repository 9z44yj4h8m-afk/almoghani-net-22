INSERT INTO public.custom_movies (youtube_id, title, description)
SELECT v.youtube_id, v.title, v.description FROM (VALUES
('1obs9eMxNAI','اوعى وشك','بطولة أحمد رزق وأحمد عيد — روتانا ستوديوز'),
('JCTETMqpgf0','رغدة متوحشة','بطولة رامز جلال ومحمد ثروت — روتانا ستوديوز'),
('DF4UUE9it3I','اللي بالي بالك','بطولة محمد سعد — روتانا ستوديوز'),
('omnLea1B3jc','بنك الحظ','بطولة محمد ممدوح وأكرم حسني ومحمد ثروت — روتانا ستوديوز'),
('fZf1Vx5bloQ','كابوريا','فيلم كامل — ميلودي أفلام'),
('4-XLUiaO3fI','خمسة باب','فيلم كامل — ميلودي أفلام'),
('kfMVxxnu2jc','أنا بضيع يا وديع','فيلم كامل — ميلودي أفلام'),
('yYXAg_-Wx6U','أمان يا دنيا','فيلم كامل — ميلودي أفلام')
) AS v(youtube_id, title, description)
WHERE NOT EXISTS (SELECT 1 FROM public.custom_movies c WHERE c.youtube_id = v.youtube_id);
