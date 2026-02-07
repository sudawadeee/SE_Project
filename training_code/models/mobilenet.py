"""
MobileNet model definitions for skin disease classification
"""
import torch
import torch.nn as nn
from torchvision import models


def get_mobilenet_v3_large(num_classes=22, pretrained=True):
    """
    Get MobileNetV3-Large model
    
    Args:
        num_classes: Number of output classes
        pretrained: Whether to use ImageNet pretrained weights
    
    Returns:
        MobileNetV3-Large model
    """
    if pretrained:
        weights = models.MobileNet_V3_Large_Weights.IMAGENET1K_V2
        model = models.mobilenet_v3_large(weights=weights)
    else:
        model = models.mobilenet_v3_large(weights=None)
    
    # Modify classifier for our number of classes
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    
    return model
