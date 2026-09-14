(()=>{
  const merged=[
    ...(window.ORTHODOX_ENTRIES || []),
    ...(window.ORTHODOX_EXPANDED_BIBLICAL || []),
    ...(window.ORTHODOX_CHURCH_SAINTS || []),
    ...(window.ORTHODOX_FEASTS || []),
    ...(window.ORTHODOX_BIBLICAL_CONTEXT || []),
    ...(window.ORTHODOX_FURTHER_EXPANSION || []),
    ...(window.ORTHODOX_DEEP_BIBLICAL || []),
    ...(window.ORTHODOX_COMPREHENSIVE_EXPANSION || []),
    ...(window.ORTHODOX_V7_EXPANSION || []),
    ...(window.ORTHODOX_V8_EXPANSION || [])
  ];
  // Later expansion layers intentionally replace older records with the same id.
  // This keeps one permanent bubble per person/being/feast.
  const unique=new Map();
  for(const entry of merged)if(entry&&entry.id)unique.set(entry.id,entry);
  window.ORTHODOX_ENTRIES=[...unique.values()];
})();
