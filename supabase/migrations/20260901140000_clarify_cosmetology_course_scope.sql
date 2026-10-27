-- Keep the public course claim distinct from the registered apprenticeship's
-- separately governed workplace and regulatory hour requirements.

update public.courses
set short_description =
      'Self-paced cosmetology theory course supporting Indiana apprenticeship and licensure preparation',
    description =
      'Cosmetology theory and applied preparation covering hair, skin, nails, makeup, safety, and client service. Course duration reflects the authored lesson seat time; supervised workplace and regulatory training requirements are tracked separately in the apprenticeship system.',
    updated_at = now()
where slug = 'cosmetology-apprenticeship';
