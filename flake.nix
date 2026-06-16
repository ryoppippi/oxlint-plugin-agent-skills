{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nix-vite-plus.url = "github:ryoppippi/nix-vite-plus";
  };

  outputs = { nixpkgs, nix-vite-plus, ... }:
    let
      system = "aarch64-darwin"; # change to your system
      pkgs = import nixpkgs { inherit system; };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = [ nix-vite-plus.packages.${system}.vp ];
      };
    };
}
