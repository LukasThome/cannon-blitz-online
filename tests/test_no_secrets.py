import subprocess


def test_config_json_not_tracked():
    result = subprocess.run(
        ["git", "ls-files", "web/config.json"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.stdout.strip() == ""
