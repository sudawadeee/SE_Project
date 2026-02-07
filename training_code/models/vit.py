"""
Vision Transformer (ViT) model definitions for skin disease classification
"""
import torch
import torch.nn as nn
import timm


def get_vit_base(num_classes=22, pretrained=True):
    """
    Get Vision Transformer Base model
    
    Args:
        num_classes: Number of output classes
        pretrained: Whether to use ImageNet pretrained weights
    
    Returns:
        ViT-Base model
    """
    model = timm.create_model(
        'vit_base_patch16_224',
        pretrained=pretrained,
        num_classes=num_classes
    )
    
    return model
