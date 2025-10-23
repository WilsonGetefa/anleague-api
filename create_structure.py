import os
import argparse

# Define the folder and file structure
structure = {
    "anleague-api/anleague-nodejs": {
        "models": [
            "user.js",
            "team.js",
            "match.js",
            "tournament.js"
        ],
        "routes": [
            "auth.js",
            "teams.js",
            "admin.js",
            "public.js"
        ],
        "controllers": [
            "teamController.js",
            "matchController.js",
            "etc."
        ],
        "views": [
            "bracket.ejs",
            "matchSummary.ejs",
            "etc."
        ],
        "public": [
            "styles.css"
        ],
        ".env": None,
        "app.js": None,
        "package.json": None,
        "README.md": None
    }
}

# Function to create structure
def create_structure(base_path, structure):
    for name, content in structure.items():
        path = os.path.join(base_path, name)
        if isinstance(content, dict):
            os.makedirs(path, exist_ok=True)
            create_structure(path, content)
        elif isinstance(content, list):
            os.makedirs(path, exist_ok=True)
            for file in content:
                open(os.path.join(path, file), 'a').close()
        elif content is None:
            open(path, 'a').close()

# Main entry
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create project folder structure.")
    parser.add_argument(
        "--path",
        type=str,
        default=".",
        help="Base directory to create the project in (default: current directory)"
    )
    args = parser.parse_args()

    base_directory = os.path.abspath(args.path)
    create_structure(base_directory, structure)
    print(f"Project structure created at: {os.path.join(base_directory, 'anleague-api/anleague-nodejs')}")
