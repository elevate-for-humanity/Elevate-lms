function include_script (script_filename) {
    var html_doc = document.getElementsByTagName("head").item(0),
        js = document.createElement("script");

    js.setAttribute("src", script_filename);
    html_doc.appendChild(js);

    return false;
}
