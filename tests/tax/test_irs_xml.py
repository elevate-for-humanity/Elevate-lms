import importlib.util, tempfile, pathlib, unittest

spec = importlib.util.spec_from_file_location("irs_xml", "scripts/tax-irs-xml.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SerializerTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.directory.name)
        self.schema = self.root / "test.xsd"
        self.schema.write_text(
            """<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="urn:test" xmlns="urn:test" elementFormDefault="qualified"><xs:element name="Return"><xs:complexType><xs:sequence><xs:element name="Year" type="xs:integer"/><xs:element name="Name" type="xs:string"/><xs:element name="Amount" type="xs:integer" maxOccurs="2"/></xs:sequence><xs:attribute name="version" type="xs:string" use="required"/></xs:complexType></xs:element></xs:schema>"""
        )
        self.builder = module.SchemaSerializer(self.schema, self.root)

    def tearDown(self):
        self.directory.cleanup()

    def test_schema_order_escaping_repetition(self):
        xml = self.builder.serialize(
            "Return",
            {
                "Amount": [4, 5],
                "Name": "A & B",
                "Year": 2026,
                "@attributes": {"version": "test"},
            },
        ).decode()
        self.assertLess(xml.index("<Year>"), xml.index("<Name>"))
        self.assertIn("A &amp; B", xml)
        self.assertEqual(xml.count("<Amount>"), 2)

    def test_unknown_fields(self):
        with self.assertRaisesRegex(ValueError, "Unknown XML field"):
            self.builder.serialize("Return", {"invented": 1})

    def test_schema_rejects_invalid_amount_without_exposing_value(self):
        with self.assertRaises(ValueError) as result:
            self.builder.serialize(
                "Return",
                {
                    "Year": 2026,
                    "Name": "TEST",
                    "Amount": "SECRET-NOT-NUMERIC",
                    "@attributes": {"version": "test"},
                },
            )
        self.assertNotIn("SECRET", str(result.exception))
        self.assertIn("schemaValid", str(result.exception))

    def test_package_boundary(self):
        with self.assertRaisesRegex(ValueError, "inside"):
            module.SchemaSerializer(self.schema, self.root / "different")


if __name__ == "__main__":
    unittest.main()
