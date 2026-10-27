#!/usr/bin/env python3
"""Build XML from IRS field-name JSON in official XSD order, then validate locally.
This serializer does not calculate taxes or imply IRS acceptance.
"""

import argparse, json, pathlib, re, sys, os
from lxml import etree

XS = "{http://www.w3.org/2001/XMLSchema}"


class SchemaSerializer:
    def __init__(self, schema, package_root):
        self.root = pathlib.Path(package_root).resolve()
        self.seen = set()
        self.elements = {}
        self.types = {}
        self.groups = {}
        self.parser = etree.XMLParser(
            resolve_entities=False, no_network=True, load_dtd=False
        )
        self.schema_path = pathlib.Path(schema).resolve()
        self.load(self.schema_path)
        self.namespace = self.doc.get("targetNamespace", "")
        self.validator = etree.XMLSchema(
            etree.parse(str(self.schema_path), self.parser)
        )

    def load(self, file):
        if self.root not in file.parents or file.suffix != ".xsd":
            raise ValueError("Schema must remain inside the official package directory")
        if file in self.seen:
            return
        self.seen.add(file)
        doc = etree.parse(str(file), self.parser).getroot()
        if not hasattr(self, "doc"):
            self.doc = doc
        for node in doc:
            name = node.get("name")
            if name:
                bucket = (
                    self.elements
                    if node.tag == XS + "element"
                    else self.groups if node.tag == XS + "group" else self.types
                )
                bucket.setdefault(name, node)
            if node.tag in [XS + "include", XS + "import"] and node.get(
                "schemaLocation"
            ):
                location = node.get("schemaLocation")
                if "://" in location:
                    raise ValueError("Remote schemas are not allowed")
                self.load((file.parent / location).resolve())

    def named(self, value, bucket):
        return bucket.get((value or "").split(":")[-1])

    def content(self, declaration):
        if declaration.get("ref"):
            declaration = self.named(declaration.get("ref"), self.elements)
            if declaration is None:
                raise ValueError("Unknown element reference")
        complex_type = declaration.find(XS + "complexType")
        if complex_type is None:
            complex_type = self.named(declaration.get("type"), self.types)
        return declaration, complex_type

    def child_declarations(self, node):
        if node is None:
            return []
        out = []
        for child in node:
            if child.tag == XS + "element":
                out.append(child)
            elif child.tag in [
                XS + "sequence",
                XS + "choice",
                XS + "all",
                XS + "complexContent",
                XS + "extension",
                XS + "restriction",
            ]:
                if child.tag == XS + "extension":
                    out.extend(
                        self.child_declarations(
                            self.named(child.get("base"), self.types)
                        )
                    )
                out.extend(self.child_declarations(child))
            elif child.tag == XS + "group":
                out.extend(
                    self.child_declarations(
                        self.named(child.get("ref"), self.groups)
                        if child.get("ref")
                        else child
                    )
                )
        return out

    def build(self, name, value, declaration=None):
        declaration = (
            declaration if declaration is not None else self.elements.get(name)
        )
        if declaration is None:
            raise ValueError("Unknown root element")
        declaration, ctype = self.content(declaration)
        element = etree.Element(
            "{" + self.namespace + "}" + name, nsmap={None: self.namespace}
        )
        if isinstance(value, dict):
            attrs = value.get("@attributes", {})
            if not isinstance(attrs, dict):
                raise ValueError("Attributes must be an object")
            for key, val in attrs.items():
                if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_.-]*", key):
                    raise ValueError("Invalid attribute name")
                element.set(key, str(val))
            declarations = self.child_declarations(ctype)
            allowed = {
                d.get("name") or d.get("ref", "").split(":")[-1] for d in declarations
            }
            if set(value) - allowed - {"@attributes", "#text"}:
                raise ValueError("Unknown XML field; use official IRS element names")
            for child in declarations:
                field = child.get("name") or child.get("ref", "").split(":")[-1]
                if field not in value:
                    continue
                items = (
                    value[field] if isinstance(value[field], list) else [value[field]]
                )
                for item in items:
                    element.append(self.build(field, item, child))
            if "#text" in value:
                element.text = str(value["#text"])
        elif isinstance(value, (str, int, float, bool)):
            element.text = (
                ("true" if value else "false")
                if isinstance(value, bool)
                else str(value)
            )
        else:
            raise ValueError(
                "XML fields must contain scalar, object or repeated array values"
            )
        return element

    def serialize(self, name, value):
        element = self.build(name, value)
        if not self.validator.validate(element):
            issues = [
                {"line": e.line, "column": e.column, "type": e.type_name}
                for e in self.validator.error_log
            ]
            raise ValueError(json.dumps({"schemaValid": False, "issues": issues}))
        return etree.tostring(
            element, xml_declaration=True, encoding="UTF-8", pretty_print=True
        )


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--xsd", required=True)
    p.add_argument("--package-root", required=True)
    p.add_argument("--root-element", default="Return")
    p.add_argument("--out", required=True)
    a = p.parse_args()
    try:
        serializer = SchemaSerializer(a.xsd, a.package_root)
        xml = serializer.serialize(
            a.root_element, json.loads(pathlib.Path(a.input).read_text())
        )
        output = pathlib.Path(a.out)
        with os.fdopen(
            os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "wb"
        ) as handle:
            handle.write(xml)
        print(
            json.dumps(
                {
                    "schemaValid": True,
                    "calculationVerified": False,
                    "businessRulesValidated": False,
                    "atsAccepted": False,
                }
            )
        )
    except Exception as error:
        # Never print field values or the XML document.
        print(
            (
                str(error)
                if isinstance(error, ValueError)
                else "Unable to generate XML from the local schema and input"
            ),
            file=sys.stderr,
        )
        sys.exit(1)
