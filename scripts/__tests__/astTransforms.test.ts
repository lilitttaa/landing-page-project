import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyAstTransforms } from '../transformer/astTransforms';
import { EDITABLE_IMPORTS } from '../transformer/config';

const SAMPLE_SOURCE = `
import React from "react";

type Props = {
  title: string;
};

export const Demo = (props: Props) => {
  return (
    <section>
      <h1>{props.title}</h1>
    </section>
  );
};
`;

describe('applyAstTransforms', () => {
  const fileName = 'Demo.tsx';

  it('adds editable imports when missing', () => {
    const transformed = applyAstTransforms(SAMPLE_SOURCE, fileName, EDITABLE_IMPORTS);
    const importLine = transformed.split('\n').find((line) => line.includes('../editable'));
    assert.ok(importLine, 'expected editable import to be present');
    for (const name of EDITABLE_IMPORTS) {
      assert.ok(importLine?.includes(name), `expected import to include ${name}`);
    }
  });

  it('extends component props with edit-mode fields', () => {
    const transformed = applyAstTransforms(SAMPLE_SOURCE, fileName, EDITABLE_IMPORTS);
    assert.ok(
      /export const Demo = \(props: Props & \{\s*isEditMode\?: boolean;[\s\S]*?onUpdate\?: \(path: string, value: any\) => void;[\s\S]*?basePath\?: string;/.test(
        transformed
      ),
      'props type should be extended with edit fields'
    );
  });

  it('injects edit context setup into component body', () => {
    const transformed = applyAstTransforms(SAMPLE_SOURCE, fileName, EDITABLE_IMPORTS);
    assert.ok(
      /const \{ isEditMode = false, onUpdate = \(\) => \{\s*\}, basePath \} = props;/.test(transformed)
    );
    assert.ok(/const handleUpdate = \(path: string, value: any\) => \{/.test(transformed));
    assert.ok(/return\s*\(\s*<EditProvider/.test(transformed));
  });
});
