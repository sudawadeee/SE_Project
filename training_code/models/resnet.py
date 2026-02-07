"""
ResNet model definitions for skin disease classification
"""
import torch
import torch.nn as nn
from torchvision import models


def get_resnet50(num_classes=22, pretrained=True):
    """
    Get ResNet50 model
    
    Args:
        num_classes: Number of output classes
        pretrained: Whether to use ImageNet pretrained weights
    
    Returns:
        ResNet50 model
    """
    if pretrained:
        weights = models.ResNet50_Weights.IMAGENET1K_V2
        model = models.resnet50(weights=weights)
    else:
        model = models.resnet50(weights=None)
    
    # Modify final fully connected layer
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    
    return model


def get_resnet101(num_classes=22, pretrained=True):
    """
    Get ResNet101 model
    
    Args:
        num_classes: Number of output classes
        pretrained: Whether to use ImageNet pretrained weights
    
    Returns:
        ResNet101 model
    """
    if pretrained:
        weights = models.ResNet101_Weights.IMAGENET1K_V2
        model = models.resnet101(weights=weights)
    else:
        model = models.resnet101(weights=None)
    
    # Modify final fully connected layer
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    
    return model
