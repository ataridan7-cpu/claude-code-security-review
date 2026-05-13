import UIKit
import SwiftUI
import FamilyControls

/// UIViewController wrapper around FamilyActivityPicker (SwiftUI).
/// Presented modally from LuminaBlocking.presentAppPicker().
class LuminaAppPickerViewController: UIViewController {

  private let onCompletion: (FamilyActivitySelection?) -> Void
  private var selection = FamilyActivitySelection()

  init(onCompletion: @escaping (FamilyActivitySelection?) -> Void) {
    self.onCompletion = onCompletion
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) { fatalError("init(coder:) not supported") }

  override func viewDidLoad() {
    super.viewDidLoad()

    let pickerView = AppPickerView(
      selection: Binding(get: { self.selection }, set: { self.selection = $0 }),
      onDone: { [weak self] in
        guard let self else { return }
        self.dismiss(animated: true) { self.onCompletion(self.selection) }
      },
      onCancel: { [weak self] in
        self?.dismiss(animated: true) { self?.onCompletion(nil) }
      }
    )

    let host = UIHostingController(rootView: pickerView)
    addChild(host)
    view.addSubview(host.view)
    host.view.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      host.view.topAnchor.constraint(equalTo: view.topAnchor),
      host.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
      host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
    ])
    host.didMove(toParent: self)
  }
}

private struct AppPickerView: View {
  @Binding var selection: FamilyActivitySelection
  let onDone: () -> Void
  let onCancel: () -> Void

  var body: some View {
    NavigationStack {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Choose Apps to Limit")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .cancellationAction) {
            Button("Cancel", action: onCancel)
          }
          ToolbarItem(placement: .confirmationAction) {
            Button("Done", action: onDone)
              .fontWeight(.semibold)
          }
        }
    }
  }
}
