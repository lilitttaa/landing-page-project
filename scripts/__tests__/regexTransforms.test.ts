import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyRegexRules } from '../transformer/regexTransforms';
import { TRANSFORM_RULES } from '../transformer/config';

const SAMPLE_CONTENT = `
<div>
  <h1>{heading}</h1>
  <Button className="primary">{button.title}</Button>
  <img src={image.src} alt={image.alt} />
  <a href={link.url}>{link.title}</a>
  {items.map((item, index) => (
    <span key={index}>{item.label}</span>
  ))}
</div>
`;

describe('applyRegexRules', () => {
  it('replaces common elements with editable counterparts', () => {
    const transformed = applyRegexRules(SAMPLE_CONTENT, TRANSFORM_RULES);
    assert.match(transformed, /<EditableText as="h1".*>{heading}<\/EditableText>/);
    assert.match(
      transformed,
      /<EditableButton button={button} path="buttons" index={index}[^>]*className="primary"/
    );
    assert.match(transformed, /<EditableImage src={image\.src} path="image"/);
    assert.match(transformed, /<EditableLink href={link\.url} path={`link.\${index}.url`}/);
    assert.match(transformed, /<EditableArray path="items" as="fragment">/);
  });
});
