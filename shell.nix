{ pkgs ? import <nixpkgs> { config.allowUnfreePredicate = pkg: builtins.elem (pkgs.lib.getName pkg) [ "terraform" ]; } }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_22
    corepack_22
    python3      # node-gyp dependency
    gnumake
    gcc
    pkg-config
    terraform
  ];
}
