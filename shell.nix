{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [ pkgs.nodejs ];
  shellHook = ''
    export NODE_PATH=${./node_modules}:${pkgs.nodejs}/lib/node_modules
  '';
}