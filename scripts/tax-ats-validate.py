#!/usr/bin/env python3
"""Validate local XML with the installed official IRS XSD. No network requests."""
import argparse
import json
from pathlib import Path
from lxml import etree


def validate(xml_path, xsd_path):
    parser = etree.XMLParser(resolve_entities=False, load_dtd=False, no_network=True)
    document = etree.parse(str(xml_path), parser)
    if document.docinfo.doctype:
        raise ValueError('DTD declarations are not permitted')
    schema_document = etree.parse(str(xsd_path), parser)
    if schema_document.docinfo.doctype:
        raise ValueError('DTD declarations are not permitted in schemas')
    schema = etree.XMLSchema(schema_document)
    valid = schema.validate(document)
    return {'schemaValid': valid, 'atsAccepted': False,
            'issues': [{'line': e.line, 'column': e.column, 'type': e.type_name}
                       for e in schema.error_log]}


if __name__ == '__main__':
    argument_parser = argparse.ArgumentParser(description=__doc__)
    argument_parser.add_argument('--xml', required=True)
    argument_parser.add_argument('--xsd', required=True)
    arguments = argument_parser.parse_args()
    try:
        result = validate(Path(arguments.xml), Path(arguments.xsd))
    except (OSError, ValueError, etree.Error) as error:
        print(json.dumps({'schemaValid': False, 'atsAccepted': False,
                          'errorType': type(error).__name__}))
        raise SystemExit(1)
    print(json.dumps(result))
    raise SystemExit(0 if result['schemaValid'] else 1)
