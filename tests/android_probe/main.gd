extends Control

const PROBE_ICON: Texture2D = preload("res://assets/probe_icon.svg")
const PAYLOAD: String = "res://assets/probe_payload.json"

func _ready() -> void:
	var background := ColorRect.new()
	background.color = Color("#101827")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var layout := VBoxContainer.new()
	layout.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layout.add_theme_constant_override("separation", 24)
	layout.add_theme_constant_override("margin_left", 36)
	layout.add_theme_constant_override("margin_right", 36)
	layout.add_theme_constant_override("margin_top", 80)
	layout.add_theme_constant_override("margin_bottom", 48)
	add_child(layout)

	var icon := TextureRect.new()
	icon.texture = PROBE_ICON
	icon.custom_minimum_size = Vector2(180, 180)
	icon.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	layout.add_child(icon)

	var title := Label.new()
	title.text = "GUMMMODS PROBE"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 32)
	layout.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Godot APK analysis test package"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_color_override("font_color", Color("#a9bad1"))
	layout.add_child(subtitle)

	var divider := HSeparator.new()
	layout.add_child(divider)

	var status := Label.new()
	status.text = "ANDROID PACKAGE READY"
	status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status.add_theme_color_override("font_color", Color("#7ee7b5"))
	status.add_theme_font_size_override("font_size", 22)
	layout.add_child(status)

	var payload_label := Label.new()
	var file := FileAccess.open(PAYLOAD, FileAccess.READ)
	if file:
		var data: Dictionary = JSON.parse_string(file.get_as_text())
		payload_label.text = "Asset manifest loaded\n" + str(data.get("asset_id", "missing"))
	else:
		payload_label.text = "Asset manifest missing"
	payload_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	payload_label.add_theme_color_override("font_color", Color("#d4deed"))
	layout.add_child(payload_label)
