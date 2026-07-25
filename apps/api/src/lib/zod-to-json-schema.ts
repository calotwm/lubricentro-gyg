import type { ZodSchema, ZodObject, ZodTypeAny } from 'zod';

/**
 * Convert a Zod schema to a JSON Schema object compatible with OpenAPI/Swagger.
 * Handles common Zod types: string, number, boolean, array, object, enum, optional, nullable.
 *
 * This is a simplified converter — covers the schemas used in this project.
 * For complex cases, add manual overrides in route schema definitions.
 */
export function zodToJsonSchema(schema: ZodSchema): Record<string, unknown> {
  return convertNode(schema);
}

function convertNode(schema: ZodTypeAny): Record<string, unknown> {
  const def = schema._def;
  const typeName = def?.typeName;

  switch (typeName) {
    case 'ZodString': {
      const result: Record<string, unknown> = { type: 'string' };
      for (const check of def.checks || []) {
        if (check.kind === 'min') result.minLength = check.value;
        if (check.kind === 'max') result.maxLength = check.value;
        if (check.kind === 'email') result.format = 'email';
        if (check.kind === 'uuid') result.format = 'uuid';
      }
      return result;
    }

    case 'ZodNumber': {
      const result: Record<string, unknown> = { type: 'number' };
      for (const check of def.checks || []) {
        if (check.kind === 'min') result.minimum = check.value;
        if (check.kind === 'max') result.maximum = check.value;
        if (check.kind === 'int') result.type = 'integer';
      }
      return result;
    }

    case 'ZodBoolean':
      return { type: 'boolean' };

    case 'ZodLiteral':
      return { const: def.value, type: typeof def.value };

    case 'ZodEnum':
      return { type: 'string', enum: def.values };

    case 'ZodNativeEnum': {
      const values = Object.values(def.values);
      return { type: typeof values[0], enum: values };
    }

    case 'ZodArray':
      return { type: 'array', items: convertNode(def.type) };

    case 'ZodObject': {
      const shape = def.shape();
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const fieldSchema = value as ZodTypeAny;
        if (fieldSchema._def?.typeName === 'ZodOptional') {
          properties[key] = convertNode(fieldSchema._def.innerType);
        } else if (fieldSchema._def?.typeName === 'ZodDefault') {
          properties[key] = convertNode(fieldSchema._def.innerType);
        } else {
          properties[key] = convertNode(fieldSchema);
          required.push(key);
        }
      }

      const result: Record<string, unknown> = { type: 'object', properties };
      if (required.length > 0) result.required = required;
      return result;
    }

    case 'ZodOptional':
      return convertNode(def.innerType);

    case 'ZodDefault':
      return convertNode(def.innerType);

    case 'ZodNullable': {
      const inner = convertNode(def.innerType);
      return { ...inner, nullable: true };
    }

    case 'ZodUnion': {
      const options = def.options.map((o: ZodTypeAny) => convertNode(o));
      return { anyOf: options };
    }

    case 'ZodEffects':
      // For refined/transformed schemas, try to convert the inner type
      if (def.schema) return convertNode(def.schema);
      return { type: 'object' };

    case 'ZodRecord':
      return { type: 'object', additionalProperties: true };

    default:
      return { type: 'object' };
  }
}
