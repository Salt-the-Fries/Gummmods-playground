extends SceneTree

func _initialize() -> void:
	var output_dir := ProjectSettings.globalize_path("res://../../.test-artifacts")
	var output_path := output_dir.path_join("godot-real.pck")
	var source_path := ProjectSettings.globalize_path("res://payload.txt")

	var mkdir_error := DirAccess.make_dir_recursive_absolute(output_dir)
	if mkdir_error != OK and mkdir_error != ERR_ALREADY_EXISTS:
		push_error("Could not create fixture output directory: %s" % mkdir_error)
		quit(1)
		return

	var packer := PCKPacker.new()
	var start_error := packer.pck_start(output_path, 16)
	if start_error != OK:
		push_error("PCKPacker.pck_start failed: %s" % start_error)
		quit(1)
		return

	var add_error := packer.add_file("res://payload.txt", source_path)
	if add_error != OK:
		push_error("PCKPacker.add_file failed: %s" % add_error)
		quit(1)
		return

	var flush_error := packer.flush()
	if flush_error != OK:
		push_error("PCKPacker.flush failed: %s" % flush_error)
		quit(1)
		return

	print("Generated authentic Godot PCK fixture: ", output_path)
	quit(0)
