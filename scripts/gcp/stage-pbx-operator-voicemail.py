#!/usr/bin/env python3
"""Stage isolated Asterisk operator and voicemail fragments; never activate carrier routing.

This script writes only to a new private directory supplied by an administrator.
A separate reviewed VM deployment must install and reload the fragments.
"""
import argparse
import os
import re
from pathlib import Path

EXTENSION = re.compile(r"^[1-9][0-9]{2}$")
MAILBOX = re.compile(r"^[1-9][0-9]{2}$")

def render(operator_extension, mailbox, pin):
    if not EXTENSION.fullmatch(operator_extension) or not MAILBOX.fullmatch(mailbox):
        raise ValueError("operator_and_mailbox_must_be_three_digit_internal_extensions")
    if not re.fullmatch(r"[0-9]{6,12}", pin):
        raise ValueError("voicemail_pin_must_be_6_to_12_digits")
    # Internal-only context; no trunk, carrier, outbound calling or public IVR changes.
    dialplan = (
        "[elevate-operator-test]\n"
        "exten => 0,1,NoOp(Isolated operator acceptance)\n"
        f" same => n,Gosub(elevate-pwa-extensions,{operator_extension},1)\n"
        " same => n,GotoIf($[\"\u0024{DIALSTATUS}\"=\"ANSWER\"]?done)\n"
        f" same => n,VoiceMail({mailbox}@elevate-test,u)\n"
        " same => n(done),Hangup()\n"
    )
    voicemail = f"[elevate-test]\n{mailbox} => {pin},Elevate Operator\n"
    return dialplan, voicemail

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage-dir", required=True)
    parser.add_argument("--operator-extension", required=True)
    parser.add_argument("--mailbox", required=True)
    args = parser.parse_args()
    pin = os.environ.get("PBX_TEST_VOICEMAIL_PIN", "")
    dialplan, voicemail = render(args.operator_extension, args.mailbox, pin)
    root = Path(args.stage_dir)
    if root.is_symlink() or root.exists():
        raise SystemExit("stage_directory_must_not_exist")
    if not root.is_absolute() or str(root).startswith(("/etc/", "/opt/elevate-pbx/", "/var/lib/asterisk/")):
        raise SystemExit("use_a_new_private_staging_directory_outside_runtime_paths")
    root.mkdir(mode=0o700, parents=False)
    for name, contents in (("extensions-operator-test.conf", dialplan), ("voicemail-operator-test.conf", voicemail)):
        fd = os.open(root / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as file:
            file.write(contents)
    print("STAGED: isolated operator/voicemail fragments; NOT installed or activated")

if __name__ == "__main__":
    main()
