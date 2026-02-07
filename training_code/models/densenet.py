"""
DenseNet model definitions for skin disease classification
"""
import torch
import torch.nn as nn
from torchvision import models


def get_densenet121(num_classes=22, pretrained=True):
    """
    Get DenseNet121 model
    
    Args:
        num_classes: Number of output classes
        pretrained: Whether to use ImageNet pretrained weights
    
    Returns:
        DenseNet121 model
    """
    if pretrained:
        weights = models.DenseNet121_Weights.IMAGENET1K_V1
        model = models.densenet121(weights=weights)
    else:
        model = models.densenet121(weights=None)
    
    # Modify classifier for our number of classes
    in_features = model.classifier.in_features
    model.classifier = nn.Linear(in_features, num_classes)
    
    return model
