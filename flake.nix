{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nix-vite-plus = {
      url = "github:ryoppippi/nix-vite-plus";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    { nixpkgs, nix-vite-plus, ... }:
    let
      nodeVersion = nixpkgs.lib.removeSuffix "\n" (builtins.readFile ./.node-version);
      nodeMajor = builtins.head (nixpkgs.lib.splitString "." nodeVersion);
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-darwin"
        "x86_64-linux"
      ];
    in
    {
      devShells = nixpkgs.lib.genAttrs systems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShellNoCC {
            packages = [
              pkgs."nodejs_${nodeMajor}"
              nix-vite-plus.packages.${system}.vp
            ];

            shellHook = ''
              # Install when node_modules is missing or the lockfile is newer.
              if [ ! -f node_modules/.pnpm/lock.yaml ] || [ pnpm-lock.yaml -nt node_modules/.pnpm/lock.yaml ]; then
                echo "Installing dependencies..."
                vp install --frozen-lockfile
              fi
            '';
          };
        }
      );
    };
}
