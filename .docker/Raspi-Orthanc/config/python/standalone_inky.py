

import json
import qrcode
from PIL import Image
from inky import InkyWHAT, auto


# Prints remote AE title

storeScuInstanceCounter = 0
host_url = "192.168.1.233"
last_study_instance_uid = "Uninitialized"

def create_qr_image(study_url:str) -> Image:
    print('in create_qr_image')
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
       )
    qr.add_data(study_url)
    print(f'create_qr_image {study_url}')
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    #img.save(output_filename)
    print('finished making image')
    return img

def update_inky(img:Image):
    # Set up the inky wHAT display and border colour
    print('in update_inky')
    #inky_display = auto(ask_user=True, verbose=True)
    inky_display = auto(ask_user=True, verbose=True)
    inky_display.set_border(inky_display.WHITE)
    w,h = img.size
    print(f'initial image size {w} x {h}')
    h_new = 300
    w_new = int((float(w) / h) * h_new)
    w_cropped = 400
    print('image resize')
    img = img.resize((w_new, h_new), resample=Image.LANCZOS)
    print('image was resized')
    # calculate coordinates to crop images to 400 pixels wide
    x0 = (w_new - w_cropped) / 2
    x1 = x0 + w_cropped
    y0 = 0
    y1 = h_new
    img = img.crop((x0, y0, x1, y1))
    # Convert the image to use a white / black / red colour palette

    pal_img = Image.new("P", (1, 1))
    pal_img.putpalette((255, 255, 255, 0, 0, 0, 255, 0, 0) + (0, 0, 0) * 252)
    
    print('image convert to RGB')
    img = img.convert("RGB").quantize(colors=3, palette=pal_img)
    # Display the final image on Inky wHAT
    print('display set_image')
    inky_display.set_image(img)
    print('display show')
    inky_display.show()

if __name__ == '__main__':
    print('about to display')
    #image_file = "InkywHAT-400x300-bw.png"
    #img = Image.open(image_file)
    img = create_qr_image(host_url)
    #img = Image.open("qr_image.png")
    update_inky(img)

# def FilterIncomingCStoreInstance(instance):
#     global storeScuInstanceCounter
#     global last_study_instance_uid
#     global host_url
#     origin = instance.GetInstanceOrigin()
#     if origin == orthanc.InstanceOrigin.DICOM_PROTOCOL:  # should always be true in the CStore callback !
#         remoteAet = instance.GetInstanceRemoteAet()
#         #print(f'remoteAet {remoteAet}')
#         #print(dir(instance))
#         metadata_json = instance.GetInstanceSimplifiedJson()
#         metadata = json.loads(metadata_json)
#         #print(type(metadata))
#         #print(dir(metadata))
#         new_study_instance_uid = metadata["StudyInstanceUID"]
#         if new_study_instance_uid != last_study_instance_uid:
#             last_study_instance_uid = new_study_instance_uid
            
#             print(f'StudyInstanceUID = {last_study_instance_uid}')
#             study_url = "http://{host_url}:3000/viewer?StudyInstanceUIDs={last_study_instance_uid}"
#             print(study_url)
#             img = create_qr_image(study_url)
#             print('returned from create_qr_image')
#             update_inky(img)
#             print('returned from update_inky')
#         else:
#             print(f'Another image for study {last_study_instance_uid}')
#     return 0x0000

# orthanc.RegisterIncomingCStoreInstanceFilter(FilterIncomingCStoreInstance)
